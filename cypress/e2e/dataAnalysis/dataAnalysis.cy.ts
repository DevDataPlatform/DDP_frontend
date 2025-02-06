describe('Data Analysis Workflow - Create, Save, Modify, and Save Again', () => {
  beforeEach(function () {
    const adminTests = [
      'should get to Data analysis tab and then enable it',
      'disables disables the ai summary feature',
    ];
    let role = 'Pipeline_Manager';
    if (adminTests.some((test) => this.currentTest.title.includes(test))) {
      role = 'Admin';
    }
    cy.login(role);
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(0)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-0.2"]').click();
  });

  it('should get to Data analysis tab and then enable it', () => {
    cy.get('button')
      .contains('Enable')
      .then(($button) => {
        // Check if the button exists in the DOM
        if ($button.length > 0) {
          cy.wrap($button).click();

          // Verify 'AI Settings' section is visible
          cy.contains('h4', 'AI Settings').should('be.visible');
          cy.contains('p', 'Enable LLM function for data analysis');
          cy.wait(2000);
          cy.get('[type="checkbox"]').should('not.be.checked');

          // Check the checkbox
          cy.get('[type="checkbox"]').check();
          cy.contains('button', 'Okay').click();

          // Go back to the LLM tab
          cy.get('[data-testid="side-menu"]')
            .find('li')
            .eq(0)
            .within(() => {
              cy.get('[data-testid="listButton"]').find('button').click();
            });
          cy.get('[data-testid="menu-item-0.2"]').click();

          // Assert that the 'Enable' button is no longer present (i.e., disabled)
          cy.contains('button', 'Enable').should('not.exist');
        } else {
          // If the button doesn't exist, log a message and skip further actions
          cy.log('Enable button not found, skipping test');
        }
      });
  });

  it('should create a summary, save it', () => {
    // Step 1: Enter a SQL query
    cy.get('[data-testid="sqlTest-box"]').type('select * from staging.worldometer_data');

    cy.get('[name="prompt"]')
      .type('Give me the summary of the result in 5 points')
      .should('have.value', 'Give me the summary of the result in 5 points');

    cy.get('[data-testid="1-default"]').click();
    cy.get('[name="prompt"]').should('have.value', 'Summarize the results of the query');
    // Step 2: Click the "Submit" button to generate the summary
    cy.intercept('POST', '/api/warehouse/ask/').as('generateSummary');
    cy.intercept('GET', 'api/tasks/stp/**').as('pollsummary');

    // Step 1: Trigger the process
    cy.contains('button', 'Submit').click();

    // Step 2: Wait for the summary generation process to complete
    cy.wait('@generateSummary').then((interception) => {
      console.log(interception.response, 'RESPONSE');
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('Data analysis initiated successfully').should('exist');
    });

    // Step 3: Poll until the status is 'completed'
    function waitForPollingToComplete() {
      cy.wait('@pollsummary').then((interception) => {
        const progress = interception.response?.body?.progress;

        // Check if the second progress item exists and has a status of 'completed'
        if (progress && progress[1]?.status === 'completed') {
          // Step 4: Save the summary with a session name
          cy.contains('button', 'Save as').click();
          //   cy.get('[name="sessionName"]')
          //     .then(($textarea) => {
          //       console.log($textarea, 'TEXTAREA');
          //     })
          //     .click();

          // .type('Test Saved Summary');
        } else {
          // If not completed, call the function recursively to wait for the next poll
          waitForPollingToComplete();
        }
      });
    }

    // Start polling
    waitForPollingToComplete();
  });

  //   it('opens a saved summary', () => {
  //     cy.intercept('POST', '/api/warehouse/ask/**/save').as('saveSession');
  //     cy.wait('@saveSession').then((interception) => {
  //       expect(interception.response.statusCode).to.eq(200);
  //       cy.contains('Test Session saved successfully').should('exist');
  //     });

  //     // Step 6: Open the saved sessions list and select the saved session
  //     cy.get('[data-testid="saved-sessions-button"]').click();
  //     cy.contains('Test Session').click();
  //   });

  it('disables disables the ai summary feature', () => {
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(6)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-4.2"]').click();
    cy.contains('h4', 'AI Settings').should('be.visible');
    cy.contains('p', 'Enable LLM function for data analysis');
    cy.wait(2000);
    cy.get('[type="checkbox"]').should('be.checked').uncheck();
  });
});
