import React from 'react';
import { Button, Form, FormGroup, Label, Input, FormText, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class CSVModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      file: ''
    };

    this.toggle = this.toggle.bind(this);
    this.submit = this.submit.bind(this);
  }

  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal
      
    }));
  }
  
  submit(event) {
    const file = event.target.files[0];
    var reader = new FileReader();
  
    reader.onload = function(e) {

      this.setState({file: reader.result})
      const header_end = reader.result.indexOf('\n')
      const header = reader.result.substring(0, header_end)
      console.log(this.state)

    }.bind(this);

    reader.readAsText(file)   
  }

  render() {
    return (
      <div>
        <Button color="danger" onClick={this.toggle}>{this.props.buttonLabel}</Button>
        <Modal isOpen={this.state.modal} toggle={this.toggle}>
          <ModalHeader toggle={this.toggle}>Upload CSV Files Here</ModalHeader>
          <ModalBody>
            <Form action="/csvAddition" method="POST">
              <FormGroup>
                <Label for="exampleFile">File</Label>
                <Input type="file" name="file" id="inputFile" onChange={this.submit}/>
                <FormText color="muted">
                  Upload your CSV file with the information about your volunteers!
                  Please format your header with the following column names: 
                  [first_name, last_name, phone_number, email, dob, address]
                </FormText>
                <a href='https://docs.google.com/spreadsheets/d/1a2f5jOrtaTU9KYkuCtRQTsjCGe5_rCk7c24_F0f2BUw/export?format=xlsx' download>CSV Header Template</a>
                <Button color="primary" >Submit</Button>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggle}>Submit</Button>
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default CSVModal;