import React from 'react';
import UserTable from './UserTable';
import styled from 'styled-components';
import { fetchUserManagementData } from '../queries';
import { Button } from 'reactstrap';
import { Set, Map } from 'immutable';
import FilterSidebar from './FilterSidebar';
import FilterInfo from './FilterInfo';
import InfiniteScroll from 'components/Shared/InfiniteScroll';
import MailingListCollapsed from './MailingListCollapsed';
import MailingListExpanded from './MailingListExpanded';
import { LeftCaretIcon } from 'components/Shared/Icon';
import { initialValues, labels } from './userFilters';
import { UserFilterContext } from './context';

const Styled = {
  Container: styled.div`
    width: 100%;
    height: 100%;
    background: white;
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  ListContainer: styled.div`
    height: 100%;
    width: 100%;
  `,
  MailingListContainer: styled.div`
    position: relative;
    height: 100%;
    width: ${props => (props.isCollapsed ? '25rem' : '100%')};
    ${props => !props.isCollapsed && 'margin-left: 2rem;'}
  `,
  // Remove isCollapsed to prevent it from being passed to the DOM
  ToggleButton: styled(({ isCollapsed, ...rest }) => <Button {...rest} />)`
    position: absolute;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    top: 50%;
    left: -20px;
    width: 40px;
    height: 40px;
    background: white;
    border: none;
    border-radius: 50%;
    color: #969696;
    ${props => !props.isCollapsed && 'transform: rotate(180deg);'}

    :focus {
      box-shadow: none;
    }

    ${props => props.disabled && 'background: white !important'}
  `,
  ToBeginningButton: styled(Button)`
    background: white;
    border: none;
    margin-left: auto;
    margin-right: 1rem;
  `,
  Term: styled.span`
    opacity: 0.7;
  `
};

const MANUAL_FILTER_KEY = '__manual';
const SEARCH_KEY_PREFIX = '__search@';
const FILTER_KEY_PREFIX = '__filter@';

const isSearchKey = key => key.startsWith(SEARCH_KEY_PREFIX);
const makeSearchKey = (term, value) => `${SEARCH_KEY_PREFIX}${term}>>>${value}`;
const makeSearchLabel = (term, label) => (
  <React.Fragment>
    <Styled.Term>{term}:</Styled.Term> &ldquo;{label}&rdquo;
  </React.Fragment>
);

const makeFilterKey = (groupKey, entryKey, value) =>
  `${FILTER_KEY_PREFIX}${groupKey}>>>${entryKey}=${value}`;

// Use Immutable's withMutations method to batch mutations
const removeReason = (stagingUsers, reason, ids) =>
  stagingUsers.withMutations(map =>
    ids.forEach(id => {
      const { reasons: oldReasons } = map.get(id);
      const newReasons = oldReasons.filter(r => r !== reason);
      if (newReasons.length === 0) {
        // Evict
        map.remove(id);
      } else {
        // Remove reason
        map.set(id, newReasons);
      }
    })
  );

class UserManager extends React.Component {
  state = {
    exploreUsers: [],
    exploreCount: 0,
    exploreFilters: [],
    exploreSearchValue: null,
    exploreSearchTerm: null,
    isLoading: false,
    isLoadingAddAll: false,
    collapsed: true,
    stagingFilters: [],
    // User id => staging user object map { user: object, reasons: Array<string> }
    //  - Reasons is string array of filter keys associated with why user is there
    //  - The set of keys = all user ids in staging mailing list
    //  - Uses immutable maps/sets from immutable.js
    stagingUsers: Map(),
    stagingManualUserIds: Set(),
    // Can be eventually refactored to be dynamic
    filterInitialValues: initialValues,
    filterLabels: labels
  };

  isUserStaged(id) {
    const { stagingUsers } = this.state;
    return stagingUsers.has(id);
  }

  componentDidMount() {
    this.loadMoreUsers();
  }

  loadMoreUsers = () => {
    // TODO make function use current filters
    const { exploreUsers } = this.state;
    const lastPaginationId = exploreUsers.length ? exploreUsers[exploreUsers.length - 1]._id : 0;
    this.setState({
      isLoading: true
    });
    fetchUserManagementData(lastPaginationId).then(result => {
      if (result && result.data && result.data.users) {
        this.setState(({ exploreUsers }) => ({
          exploreUsers: exploreUsers.concat(result.data.users),
          isLoading: false
        }));
      }
    });
  };

  onEditUser = () => {
    // TODO implement?
    // ? what is this function for?
  };

  onToggleCollapse = () => {
    // TODO implement expanded view
    this.setState(({ collapsed }) => ({
      collapsed: !collapsed
    }));
  };

  onToggleUserMailingList = idx => () => {
    const { exploreUsers } = this.state;
    const user = exploreUsers[idx];
    if (this.isUserStaged(user._id)) {
      // Force unstage
      const { stagingManualUserIds } = this.state;
      this.setState(({ stagingUsers }) => ({ stagingUsers: stagingUsers.delete(user._id) }));
      if (stagingManualUserIds.has(user._id)) {
        // Only remove from manual Ids if staged with it to prevent new reference being created
        // for stagingManualUserIds
        this.setState(({ stagingManualUserIds }) => ({
          stagingManualUserIds: stagingManualUserIds.delete(user._id)
        }));
      }
    } else {
      // Stage as manual
      this.setState(({ stagingManualUserIds, stagingUsers }) => ({
        stagingManualUserIds: stagingManualUserIds.add(user._id),
        stagingUsers: stagingUsers.set(user._id, {
          user,
          reasons: [MANUAL_FILTER_KEY]
        })
      }));
    }
  };

  clearMailingList = () => {
    this.setState({
      stagingFilters: [],
      stagingUsers: Map(),
      stagingManualUserIds: Set()
    });
  };

  onSearchSubmit = (searchValue, searchTerm) => {
    // TODO dispatch API call to update table and count
    const isEmpty = searchValue === '';
    this.setState({
      exploreSearchValue: isEmpty ? null : searchValue,
      exploreSearchTerm: isEmpty ? null : searchTerm
    });
  };

  // Converts filter shape from:
  //   { group1: { valueA: false, valueB: true }, group2: { valueA: false } }
  // to: (valueA gets removed,, and group2 isn't included)
  //   [ { key: "group1", values: { valueB: true } } ]
  // This makes it easier to determine if any filters have been applied and
  // to convert the current filter set to a JSON-serializable API query param
  onApplyFilters = filters => {
    // TODO dispatch API call to update table and count
    // TODO replaces partial functionality in queries.js
    if (filters == null) {
      // Clear filters
      this.setState({ exploreFilters: [] });
    } else {
      this.setState({
        exploreFilters: Object.entries(filters).reduce((filterEntries, [groupKey, { values }]) => {
          let reducedFilterOptions = null;
          Object.entries(values).forEach(([optionKey, optionValue]) => {
            if (optionValue) {
              // Truthy filter value: add to reduced options
              if (reducedFilterOptions == null) reducedFilterOptions = {};
              reducedFilterOptions[optionKey] = optionValue;
            }
          });

          if (reducedFilterOptions == null) {
            // Skip empty filter groups
            return filterEntries;
          } else {
            return [...filterEntries, { key: groupKey, values: reducedFilterOptions }];
          }
        }, [])
      });
    }
  };

  onAddAllClick = () => {
    // Grab current filters into closure
    const { exploreFilters, exploreSearchValue, exploreSearchTerm } = this.state;
    this.setState({ isLoadingAddAll: true });
    // TODO implement dispatching API call to get all users
    new Promise(resolve => setTimeout(resolve, 300)).then(() => {
      const newUsers = []; // TODO replaceme with API result
      const { stagingUsers, stagingFilters, filterLabels } = this.state;
      const newUserReasonMap = stagingUsers.asMutable(); // Create as mutable to batch mutations
      this.setState({ isLoadingAddAll: false });

      // Add all users to new user reason map
      newUsers.forEach(({ _id }) => {
        if (!newUserReasonMap.has(_id)) {
          newUserReasonMap.set(_id, []);
        }
      });

      // Add filters to stagingFilters
      const newFilters = [];
      // Prepare global list of reasons to batch add at the end
      const globalReasons = [];

      if (exploreSearchValue != null) {
        const searchKey = makeSearchKey(exploreSearchTerm, exploreSearchValue);
        const searchLabel = makeSearchLabel(exploreSearchTerm, exploreSearchValue);
        newFilters.push({ key: searchKey, label: searchLabel });
        // Search values must apply to entire returned set, so add as global reason
        globalReasons.push(searchKey);
      }

      if (exploreFilters.length > 0) {
        exploreFilters.forEach(({ key: groupKey, values }) => {
          const hasMultipleValues = values.length > 1;
          Object.entries(values).forEach(([entryKey, entryValue]) => {
            const filterKey = makeFilterKey(groupKey, entryKey, entryValue);
            const filterLabel = filterLabels[groupKey][entryKey];
            newFilters.push({ key: filterKey, label: filterLabel });
            if (hasMultipleValues) {
              // Single filter values must apply to entire returned set, so add as global reason
              globalReasons.push(filterKey);
            } else {
              // TODO resolve non-disjoint filter reasons per user
            }
          });
        });
      }

      // Add in all global reasons
      newUsers.forEach(({ _id }) => {
        newUserReasonMap.update(_id, reasons => [...reasons, globalReasons]);
      });

      this.setState(({ stagingFilters }) => {
        const existingFilterKeys = new Set(stagingFilters.map(({ key }) => key));
        return {
          stagingUsers: newUserReasonMap.asImmutable(),
          stagingFilters: [
            ...stagingFilters,
            ...newFilters.filter(({ key }) => !existingFilterKeys.has(key))
          ]
        };
      });
    });
  };

  onClearFilter = key => {
    if (key === MANUAL_FILTER_KEY) {
      // Remove manual from list of reasons
      this.setState(({ stagingManualUserIds, stagingUsers }) => ({
        stagingManualUserIds: Set(),
        stagingUsers: removeReason(stagingUsers, MANUAL_FILTER_KEY, stagingManualUserIds)
      }));
    } else {
      this.setState(({ stagingUsers, stagingFilters }) => ({
        stagingUsers: removeReason(stagingUsers, key, stagingUsers.keySeq()),
        stagingFilters: stagingFilters.filter(({ key: filterKey }) => filterKey !== key)
      }));
    }
  };

  hasFilters() {
    const { exploreFilters, exploreSearchTerm, isLoading } = this.state;
    return !isLoading && (exploreFilters.length > 0 || exploreSearchTerm != null);
  }

  getStagingFilters() {
    const { stagingManualUserIds, stagingFilters } = this.state;
    const manualCount = stagingManualUserIds.size;
    const filters = [...stagingFilters];
    if (manualCount) {
      filters.push({
        key: MANUAL_FILTER_KEY,
        label: `+ ${manualCount} other ${manualCount === 1 ? 'volunteer' : 'volunteers'}`
      });
    }
    return filters;
  }

  render() {
    const {
      isLoading,
      exploreUsers,
      exploreCount,
      stagingUsers,
      collapsed,
      isLoadingAddAll,
      filterInitialValues,
      filterLabels
    } = this.state;

    // Add the inMailingList prop to the currently displayed table users
    const mappedExploreUsers = exploreUsers.map(user => ({
      ...user,
      inMailingList: this.isUserStaged(user._id)
    }));

    return (
      <UserFilterContext.Provider
        value={{ initialValues: filterInitialValues, labels: filterLabels }}
      >
        <Styled.Container>
          <FilterSidebar
            onSearchSubmit={this.onSearchSubmit}
            onApplyFilters={this.onApplyFilters}
          />
          {collapsed && (
            <Styled.ListContainer>
              <InfiniteScroll loadCallback={this.loadMoreUsers} isLoading={isLoading}>
                <FilterInfo
                  filtersApplied={this.hasFilters()}
                  onClickAddAll={this.onAddAllClick}
                  matchedCount={exploreCount}
                  loading={isLoadingAddAll}
                />
                <UserTable
                  users={mappedExploreUsers}
                  editUserCallback={this.onEditUser}
                  onUserToggle={this.onToggleUserMailingList}
                />
              </InfiniteScroll>
            </Styled.ListContainer>
          )}
          <Styled.MailingListContainer isCollapsed={collapsed}>
            <Styled.ToggleButton isCollapsed={collapsed} onClick={this.onToggleCollapse}>
              <LeftCaretIcon />
            </Styled.ToggleButton>
            {collapsed ? (
              <MailingListCollapsed
                users={Array.from(stagingUsers.values())}
                filters={this.getStagingFilters()}
                onClearClick={this.clearMailingList}
                onClearFilter={this.onClearFilter}
              />
            ) : (
              <MailingListExpanded />
            )}
          </Styled.MailingListContainer>
        </Styled.Container>
      </UserFilterContext.Provider>
    );
  }
}

export default UserManager;
