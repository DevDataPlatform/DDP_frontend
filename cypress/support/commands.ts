/// <reference types="cypress" />
declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(role): Chainable<string>;
  }
}

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
Cypress.Commands.add('login', (role) => {
  const Role = {
    Admin: {
      email: Cypress.env('admin_username'),
      password: Cypress.env('admin_password'),
    },
    Pipeline_Manager: {
      email: Cypress.env('pipeline_manager_username'),
      password: Cypress.env('pipeline_manager_password'),
    },
  };
  const currentRole = Role[role];
  cy.visit('https://staging.dalgo.in/login');
  cy.get('[data-testid="username"]').type(currentRole.email);
  cy.get('[data-testid="password"]').type(currentRole.password);
  cy.get('[data-testid="submitbutton"]').click();
  cy.get('div').should('contain', 'User logged in successfully');
});
