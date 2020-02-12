import React, { Component, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';

import onboarding1 from '../../../images/onboarding_update1.svg';
import OnboardingManager from './OnboardingManager';
// import {Route} from "react-router-dom";
const Styled = {
  Container: styled.div`
    width: 100%;
    height: 100%;
    background: ${props => props.theme.grey9};
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: space-around;
  `,
  HorizontalContainer: styled.div`
    display: flex;
    flex-direction: row;
    margin-left: 8rem;
    margin-right: 8rem;
    justify-content: stretch;
  `,
  ImgContainer: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 3rem;
    margin-bottom: 3rem;
  `,
  Button: styled(Button)`
    border: none;
    background: black;
  `,
  BackButton: styled(Button)`
    margin-left: 3rem;
    border: none;
  `,
  ButtonContainer: styled.div`
    display: flex;
    justify-content: center;
    align-items: center
    flex-direction: row
  `,
  FormField: styled(FormGroup)`
    border: none;
    justfiy-content: stretch;
    flex: 1;
  `
};

class AdminOnboarding1 extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      accountType: 'volunteer'
    }
  }


  render() {
    console.log(this.props.data);
    return (
      <Styled.Container>
        <Styled.HorizontalContainer style={{ margin: '1rem' }}>
          <Styled.BackButton>
            <Link to="/">Back</Link>
          </Styled.BackButton>
        </Styled.HorizontalContainer>
        <Styled.HorizontalContainer style={{ textAlign: 'center' }}>
          <legend> Hi, let's get your account set up.</legend>
        </Styled.HorizontalContainer>
        <Styled.ImgContainer>
          <img style={{ width: '900px', height: '87px' }} alt="onboard" src={onboarding1} />
        </Styled.ImgContainer>
        <Styled.HorizontalContainer style={{ marginTop: '3rem' }}>
          <legend>Account Information</legend>
        </Styled.HorizontalContainer>
        <Form>
          <Styled.HorizontalContainer style={{ justifyContent: 'stretch', marginTop: '2rem' }}>
            <Styled.FormField style={{ marginRight: '50px' }}>
              <Input type="email" name="email" id="exampleEmail" placeholder="Email" onChange={(e)=> this.setState({ email: e.target.value})}/>
            </Styled.FormField>
            <Styled.FormField>
              <Input type="password" name="password" id="examplePassword" placeholder="Password" onChange={(e)=> this.setState({ password: e.target.value})}/>
            </Styled.FormField>
          </Styled.HorizontalContainer>
          <Styled.HorizontalContainer style={{ justifyContent: 'stretch', marginTop: '1rem' }}>
            <Styled.FormField style={{ marginRight: '50px' }}>
              <Input type="text" name="fname" id="firstName" placeholder="First Name" onChange={(e)=> this.setState({ firstName: e.target.value})}/>
            </Styled.FormField>
            <Styled.FormField style={{ marginRight: '50px' }}>
              <Input type="text" name="lname" id="lastName" placeholder="Last Name" onChange={(e)=> this.setState({ lastName: e.target.value})}/>
            </Styled.FormField>
            <Styled.FormField>
              <Input type="select" name="select" id="roleSelect">
                <option>Role1</option>
                <option>Role2</option>
                <option>Role3</option>
              </Input>
            </Styled.FormField>
          </Styled.HorizontalContainer>
          <Styled.HorizontalContainer
            style={{ marginTop: '5rem', marginBottom: '1rem', justifyContent: 'flex-end' }}
          >
            <Styled.Button onClick={() => {
              this.props.setData('onboarding1', this.state);
              this.props.nextStep();
            }}>
              <span style={{ color: '#f79a0d' }}>Next</span>
              {/* <Link to="/onboarding2"> Next </Link> */}
            </Styled.Button>
          </Styled.HorizontalContainer>
        </Form>
      </Styled.Container>
    );
  }
};

export default AdminOnboarding1;
