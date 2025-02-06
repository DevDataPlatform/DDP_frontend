import { v4 as uuidv4 } from 'uuid';

describe('Header', () => {
  beforeEach(function () {
    const adminTests = ['Switch between org', 'Create org', 'Render profile modal menu for admin'];
    let role = 'Pipeline_Manager';
    if (adminTests.some((test) => this.currentTest.title.includes(test))) {
      role = 'Admin';
    }
    cy.login(role);
    // need to wait since the create org api takes time
    // cypress is intelligent to figure out the call with just the dynamic path
    cy.intercept('/api/dashboard/v1').as('dashboard');
    cy.wait(['@dashboard']);
  });

  it('Should render logo and profile icon', () => {
    cy.get('[alt="dalgo logo"]').should('be.visible');
    cy.get('[alt="profile icon"]').should('be.visible');
  });

  it('Render profile modal menu for admin', () => {
    cy.get('[alt="profile icon"]').click();
    // check logged in user is our cypress env user
    cy.get('h6').should('contain', Cypress.env('admin_username'));
    // should also have create new org option
    cy.get('h6').should('contain', 'Create new org');
  });

  it('Admin Create org & select it', () => {
    const name = `cyp_${uuidv4()}`;
    cy.get('[alt="profile icon"]').click();
    cy.contains('h6', 'Create new org').click();
    // enter org name
    cy.get('[data-testid="input-orgname"]').type(name);

    //plan
    cy.contains('label', 'Select Plan Type')
      .parent()
      .find('.MuiAutocomplete-popupIndicator')
      .click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'Dalgo').click();

    //superset included
    cy.contains('label', 'Is Superset Included?')
      .parent()
      .find('.MuiAutocomplete-popupIndicator')
      .click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'Yes').click();

    //Select Duration
    cy.contains('label', 'Select Duration')
      .parent()
      .find('.MuiAutocomplete-popupIndicator')
      .click();
    cy.get('.MuiAutocomplete-listbox').should('be.visible');
    cy.contains('.MuiAutocomplete-option', 'Annual').click();

    //keeping dates field empty for now

    // submit

    cy.get('[data-testid="savebutton"]').click();
    // wait till the call is completed
    cy.wait(12000);
    // check if the newly created org is selected
    cy.get('h6').should('contain', name);
  });

  it('Switch between org', () => {
    cy.get('[alt="profile icon"]').click();
    cy.get('[role="menuitem"]')
      .should('have.length.greaterThan', 2)
      .then(() => {
        cy.get('[role="menuitem"]').eq(0).click();
        cy.get('body').click(0, 0);
        cy.get('[alt="profile icon"]').click();
        cy.get('[role="menuitem"]').eq(1).click();
        cy.get('body').click(0, 0);
      });
  });
});
