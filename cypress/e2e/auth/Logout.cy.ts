describe('Logout', () => {
  it('should logout correctly', () => {
    // login with the creds
    cy.login('Admin');
    // click the profile icon on top right
    cy.get('[alt="profile icon"]').click();
    // select the logout item and click
    cy.get('[alt="logout icon"]').click();
    // should see the login page
    cy.get('h5').should('contain', 'Log In');
  });
});
