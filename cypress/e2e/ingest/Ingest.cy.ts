import { v4 as uuidv4 } from 'uuid';

describe('Ingest', () => {
  beforeEach(() => {
    cy.login('Admin');
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-1.1"]').click();
  });

  it('Render ingest sub menu item', () => {
    // three tabs should be visible
    cy.get('[role="tab"]').should('have.length', 3);
    cy.get('[role="tab"]').eq(0).should('contain', 'Connections');
    cy.get('[role="tab"]').eq(1).should('contain', 'Sources');
    cy.get('[role="tab"]').eq(2).should('contain', 'Your Warehouse');
  });
});
