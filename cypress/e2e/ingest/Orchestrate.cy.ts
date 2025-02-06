describe('Orchestrate', () => {
  beforeEach(() => {
    cy.login('Admin');
    cy.get('[data-testid="side-menu"]').contains('Pipeline overview').should('be.visible');

    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.get('[data-testid="side-menu"]').contains('Orchestrate').click();
  });

  it('Creates a pipleine', () => {
    cy.get('[data-testid="add-new-pipeline"]').contains('+ New Pipeline').click({ force: true });

    //filling the details

    cy.contains('label', 'Name*').parent().find('input').type('cypress orchestrate test');
    // Open the dropdown
    cy.contains('label', 'Connections').parent().find('.MuiAutocomplete-popupIndicator').click();

    // Wait for the dropdown options to be visible, then click the item
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'cypress').click();

    // select run all tasks.
    cy.get('input[type="checkbox"]').check();

    // selecting when to run the task.
    cy.contains('label', 'Daily/Weekly').parent().find('.MuiAutocomplete-popupIndicator').click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'weekly').click();

    //selecting day of the week
    cy.contains('label', 'Day of the week')
      .parent()
      .find('.MuiAutocomplete-popupIndicator')
      .click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'Friday').click();

    //select the clock icon
    cy.get('[data-testid="ClockIcon"]').click();
    cy.contains('ul.MuiList-root.MuiMultiSectionDigitalClockSection-root', '01').click();
    cy.contains('button', 'OK').click();

    //Save this
    //api intercept here.
    cy.intercept('POST', 'api/prefect/v1/flows/').as('createFlow');
    cy.contains('button', 'Save changes').click();
    cy.wait('@createFlow').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      cy.contains('td', 'cypress orchestrate test');
    });
  });
  it('checks the sync operation', () => {
    cy.intercept('POST', '/api/prefect/v1/flows/*/flow_run/').as('createFlowTask');
    cy.get('[data-testid="btn-quickrundeployment-cypress orchestrate test"]').click();

    cy.intercept('GET', 'api/prefect/v1/flows/').as('pollsync');
    cy.wait('@createFlowTask').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });

    function waitForPollingToComplete() {
      cy.wait('@pollsync').then((interception) => {
        const lock = interception.response?.body[0]?.lock;
        console.log(interception.response?.body[0], 'LOCK');
        // Check if the second progress item exists and has a status of 'completed'
        if (lock === 'complete' || lock == null) {
          cy.get('[data-testid="flowstate-cypress orchestrate test"]').contains('success');
        } else {
          // If not completed, call the function recursively to wait for the next poll
          waitForPollingToComplete();
        }
      });
    }
    waitForPollingToComplete();
  });

  it('deletes flow', () => {
    cy.get('[data-testid="MoreHorizIcon"]').click();
    cy.get('[data-testid="deletetestid"]').click();
    cy.contains('button', 'I Understand the consequences, confirm').click();
  });

  it('deletes connection', () => {
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-1.1"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Connections');
    cy.get('[data-testid="MoreHorizIcon"]').click();
    cy.get('[data-testid="deletetestid"]').click();
    cy.contains('button', 'I Understand the consequences, confirm').click();
  });

  it('deletes source', () => {
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-1.1"]').click();
    cy.get('[role="tab"]').eq(1).should('contain', 'Sources');
    cy.get('[role="tab"]').eq(1).click();
    cy.get('[data-testid="MoreHorizIcon"]').click();
    cy.get('[data-testid="deletetestid"]').click();
    cy.contains('button', 'I Understand the consequences, confirm').click();
  });
});
