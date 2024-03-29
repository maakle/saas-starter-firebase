import { MembershipRole } from '~/lib/organizations/types/membership-role';

const $get = (value: string) => cy.cyGet(value);
const DEFAULT_ORGANIZATION_ID = `jpbCRSjRqW7IddsaKomZ`;

const organizationPageObject = {
  $getOrganizationNameInput: () => $get(`organization-name-input`),
  $getUpdateOrganizationSubmitButton: () =>
    $get(`update-organization-submit-button`),
  $currentOrganization: () => $get(`organization-selector`),
  $createOrganizationButton: () => $get(`create-organization-button`),
  $confirmCreateOrganizationButton: () =>
    $get(`confirm-create-organization-button`),
  $createOrganizationNameInput: () => $get(`create-organization-name-input`),
  $getMemberByEmail(invitedMemberEmail: string) {
    return cy.contains(`[data-cy="organization-member"]`, invitedMemberEmail);
  },
  $getInvitedMembers: () => $get(`invited-member`),
  $getInvitedMemberByEmail(invitedMemberEmail: string) {
    return this.$getInvitedMembers().contains(`[data-cy]`, invitedMemberEmail);
  },
  $getMemberActionsDropdown: () => $get(`member-actions-dropdown`),
  $getInviteMembersForm: () => $get('invite-members-form'),
  $getInvitationEmailInput: (index = 0) => $get(`invite-email-input`).eq(index),
  $getAppendNewInviteButton: () => $get(`append-new-invite-button`),
  $getInvitationsSubmitButton: () => $get(`send-invites-button`),
  $getDeleteInviteButton: () => $get(`delete-invite-button`),
  $getConfirmDeleteInviteButton: () => $get(`confirm-delete-invite-button`),
  $getConfirmTransferOwnershipButton: () =>
    $get(`confirm-transfer-ownership-button`),
  $getRoleSelector: (index = 0) => $get(`role-selector-trigger`).eq(index),
  $getRoleBadge: () => $get(`member-role-badge`),
  $removeMemberActionButton: () => $get(`remove-member-action`),
  $transferOwnershipAction: () => $get('transfer-ownership-action'),
  $updateMemberRoleActionButton: () => $get(`update-member-role-action`),
  $getLeaveOrganizationButton: () => $get(`leave-organization-button`),
  $getDeleteOrganizationConfirmInput: () =>
    $get(`delete-organization-input-field`),
  $getDeleteOrganizationButton: () => $get(`delete-organization-button`),
  $getConfirmDeleteOrganizationButton: () =>
    $get(`confirm-delete-organization-button`),
  $getConfirmLeaveOrganizationButton: () =>
    $get(`confirm-leave-organization-button`),
  getDefaultOrganizationId() {
    return DEFAULT_ORGANIZATION_ID;
  },
  createOrganization(organizationName: string) {
    organizationPageObject
      .$currentOrganization()
      .wait(500)
      .click({
        force: true,
      })
      .then(() => {
        return organizationPageObject.$createOrganizationButton();
      })
      .should('be.visible');

    organizationPageObject.$createOrganizationButton().click();

    organizationPageObject
      .$createOrganizationNameInput()
      .wait(500)
      .clear()
      .type(organizationName, {
        delay: 200,
      });

    organizationPageObject.$confirmCreateOrganizationButton().click();

    cy.wait(750);

    // close the select
    cy.get('body').click({
      force: true,
    });
  },
  useDefaultOrganization: () => {
    cy.setCookie('organizationId', DEFAULT_ORGANIZATION_ID);
  },
  switchToOrganization(name: string) {
    this.$currentOrganization()
      .click({
        force: true,
      })
      .then(() => {
        return cy.contains('[data-cy="organization-selector-item"]', name);
      })
      .should('be.visible')
      .then((el) => {
        return cy.wrap(el).click({
          force: true,
        });
      })
      .then(() => {
        organizationPageObject.assertCurrentOrganization(name);
      });

    return this;
  },
  openMemberActionsDropdown() {
    this.$getMemberActionsDropdown().click();

    // ugly but needed, elements called right after are detached and Cypress
    // doesn't handle it well
    cy.wait(150);

    return this;
  },
  openRoleSelectorDropdown() {
    this.$getRoleSelector().click();

    return this;
  },
  selectRole(role: MembershipRole) {
    this.openRoleSelectorDropdown();
    cy.cyGet(`role-item-${role}`).click();

    return this;
  },
  inviteMember(email: string, role = MembershipRole.Member) {
    cy.intercept(
      {
        method: 'POST',
        path: '*invite',
      },
      (req) => {
        expect(req.body[0].email).to.equal(email);
        expect(req.body[0].role).to.equal(role);

        req.continue((res) => {
          expect(res.statusCode).to.equal(200);
        });
      },
    ).as('inviteMember');

    this.$getInvitationEmailInput().type(email);
    this.selectRole(role);
    this.$getInvitationsSubmitButton().click();

    cy.wait('@inviteMember');

    return this;
  },
  removeMember(email: string) {
    this.$getMemberByEmail(email).within(() => {
      this.openMemberActionsDropdown();
    });

    this.$removeMemberActionButton().click({ force: true });

    cy.cyGet(`confirm-remove-member`).click();

    return this;
  },
  updateMemberRole(email: string, role: MembershipRole) {
    this.$getMemberByEmail(email).within(() => {
      this.openMemberActionsDropdown();
    });

    this.$updateMemberRoleActionButton().click({ force: true });

    this.selectRole(role);
    cy.cyGet(`confirm-update-member-role`).click();

    return this;
  },
  transferOwnership(email: string) {
    this.$getMemberByEmail(email).within(() => {
      this.openMemberActionsDropdown();
    });

    this.$transferOwnershipAction().click({ force: true });
  },
  assertCurrentOrganization(name: string) {
    this.$currentOrganization().should('contain', name);
  },
};

export default organizationPageObject;
