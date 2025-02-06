describe('User management', () => {
  beforeEach(() => {
    cy.login('Admin');
  });
  it('Invites a new user', () => {
    // Go to user management
    cy.get('[data-testid="side-menu"]')
      .find('li')
      .eq(4)
      .within(() => {
        cy.get('[data-testid="listButton"]').find('button').click();
      });
    cy.get('[data-testid="menu-item-4.1"]').click();
    cy.get('[role="tab"][tabindex="0"]').should('contain', 'Users');

    //inviting users

    cy.contains('button', 'Invite user').click();
    cy.get('[name="invited_email"]')
      .type('dummy@gmail.com')
      .should('have.value', 'dummy@gmail.com');

    cy.contains('label', 'Role*').parent().find('.MuiInputBase-formControl').click();
    cy.get('.MuiMenu-list') // Escape special characters like ":" in the ID
      .should('have.attr', 'role', 'listbox'); // Optional: Validate attributes
    cy.contains('li', 'Super User').click();

    //sending invitations.
    cy.contains('button', 'Send invitation').click();

    //clicking on pending invitations and checking and deleting
    cy.get('[role="tab"][tabindex="-1"]').should('contain', 'Pending Invitations').click();
    cy.contains('td', 'dummy@gmail.com').should('be.visible');

    //deleting the invite
    cy.get('[data-testid="MoreHorizIcon"]').click();
    cy.get('[data-testid="deletetestid"]').click();
    cy.contains('button', 'I Understand the consequences, confirm').click();

    //deletd
    cy.contains('td', 'dummy@gmail.com').should('not.exist');
  });
});
