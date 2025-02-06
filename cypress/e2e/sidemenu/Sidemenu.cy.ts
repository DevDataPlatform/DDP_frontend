describe('Side menu', () => {
  beforeEach(() => {
    cy.login('Admin');
  });

  it('Initial render of side menu', () => {
    // parent
    cy.get('[data-testid="side-menu"]').contains('Analysis').should('be.visible');

    cy.get('[data-testid="side-menu"]').contains('Pipeline overview').should('be.visible');

    cy.get('[data-testid="side-menu"]').contains('Explore').should('be.visible');
    cy.get('[data-testid="side-menu"]').contains('Data Quality').should('be.visible');
    cy.get('[data-testid="side-menu"]').contains('Settings').should('be.visible');
  });

  it('Toggle the side menu collapsible', () => {
    // Collapse the pipeline overview child items
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .then(($li) => {
        console.log('Element at eq(2):', $li); // Log the element to the console
      })
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.contains('Ingest').should('be.visible');

    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });

    cy.contains('Ingest').should('not.be.visible');
  });

  it('Switching between menu items', () => {
    // By default we see the pipeline overview window
    cy.get('h4').should('contain', 'Overview');

    // Go to user management
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(4)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-4.1"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Users');

    cy.get('[role="tab"][tabindex="-1"]').should('contain', 'Pending Invitations');

    cy.get('[role="tab"][tabindex="-1"]').should('be.visible').click();
    cy.get('[role="tab"][tabindex="-1"]').should('contain', 'Users');

    // Go to ingest
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-1.1"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Connections');
    cy.get('[role="tab"][tabindex="-1"]').eq(0).should('contain', 'Sources');
    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'Your Warehouse');

    cy.get('[role="tab"][tabindex="-1"]').eq(0).should('contain', 'Sources').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Sources');

    cy.get('[role="tab"][tabindex="-1"]').eq(1).should('contain', 'Your Warehouse').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Your Warehouse');

    // // Go to transform
    cy.get('[data-testid="menu-item-1.2"]').click();

    cy.get('h4').should('contain', 'Transform');
    // cy.get('[role="tab"][tabindex="0"]').should('contain', 'Setup');

    //orchestrate
    cy.get('[data-testid="menu-item-1.3"]').click();
    cy.get('h4').should('contain', 'Pipelines');

    //explore
    cy.get('[data-testid="menu-item-2"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Preview');
    cy.get('[role="tab"][tabindex="-1"]').should('contain', 'Data');
  });
});
