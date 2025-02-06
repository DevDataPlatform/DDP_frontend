describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('https://staging.dalgo.in/login');
  });

  it('Load the login page', () => {
    cy.get('h5').should('contain', 'Log In');
  });

  it('Validations', () => {
    cy.get('[data-testid="submitbutton"]').click();
    cy.get('p').should('contain', 'Password is required');
    cy.get('p').should('contain', 'Business email is required');
  });

  it('Redirect to forgot password page', () => {
    cy.contains('Forgot password?').click();
    cy.get('h5').should('contain', 'Forgot password');
  });

  it('Redirect to Sign up', () => {
    cy.contains('Sign Up').click();
    cy.get('h5').should('contain', 'Create an account');
  });

  it('Failure login', () => {
    cy.get('[data-testid="username"]').type('randomeusername');
    cy.get('[data-testid="password"]').type('randompassword');
    cy.get('[data-testid="submitbutton"]').click();
    cy.get('div').should('contain', 'Please check your credentials');
  });

  it('Successfully login', () => {
    cy.get('[data-testid="username"]').type(Cypress.env('admin_username'));
    cy.get('[data-testid="password"]').type(Cypress.env('admin_password'));
    cy.get('[data-testid="submitbutton"]').click();
    cy.get('div').should('contain', 'User logged in successfully');
  });
});
