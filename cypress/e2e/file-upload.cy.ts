const AVATAR_FILE = 'demo-avatar.webp'
const GALAXY_FILE = 'galaxy.jpg'

it('Should be able to create a chat, write messages and edit the chat.', () => {
  cy.visit('/')

  cy.findByRole('heading', { name: 'Upload files' }).should('be.visible')
  cy.findByRole('heading', { name: 'Uploaded files' }).should('be.visible')
  cy.findByText('No files uploaded yet').should('be.visible')

  // In the real world, we would mock the API calls using cy.intercept()
  cy.wait(500)

  cy.findByLabelText('Click to select files').selectFile(
    [`cypress/fixtures/${AVATAR_FILE}`, `cypress/fixtures/${GALAXY_FILE}`],
    {
      force: true,
    }
  )

  cy.findByText(AVATAR_FILE).should('be.visible')
  cy.findByText(GALAXY_FILE).should('be.visible')
  cy.findByText('No files uploaded yet').should('not.exist')

  cy.findByRole('button', { name: `Cancel file upload ${AVATAR_FILE}` }).click()
  cy.findByText(AVATAR_FILE).should('not.exist')

  cy.findByText('Upload failed. Please try again.').should('be.visible')
  cy.findByRole('button', { name: `Retry file upload ${GALAXY_FILE}` }).click()

  cy.findByRole('progressbar', {
    name: `Upload progress for ${GALAXY_FILE}: 100%`,
  })

  cy.findByRole('button', { name: `Delete file ${GALAXY_FILE}` }).click()

  cy.findByText('No files uploaded yet').should('be.visible')
})
