const store = require('../../utils/tuge-store')

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  data: {
    ...store.snapshot(),
    loginPhone: '',
    loginSms: '',
  },
  lifetimes: {
    attached() {
      this._unsub = store.subscribe((snap) => {
        this.setData(snap)
      })
    },
    detached() {
      if (this._unsub) this._unsub()
    },
  },
  methods: {
    noop() {},
    closeModal() { store.closeModal() },
    bannerTap() { store.bannerTap() },
    closeBanner() { store.closeBanner() },
    goCheckout() { store.goCheckout() },
    copyPayUrl() { store.copyPayUrl() },
    confirmSandboxPay() { store.confirmSandboxPay() },
    cancelCurrentOrder() { store.cancelCurrentOrder() },
    acceptRouteResult() { store.acceptRouteResult() },
    closeTestModal() { store.closeTestModal() },
    selectTestOption(e) { store.selectTestOption(Number(e.currentTarget.dataset.i)) },
    finishPersonalityToHome() { store.finishPersonalityToHome() },
    closeTripDetail() { store.closeTripDetail() },
    generateDiary() { store.generateDiary() },
    closeOrderSheet() { store.closeOrderSheet() },
    setOrderFilter(e) { store.setOrderFilter(e.currentTarget.dataset.key) },
    continuePay(e) { store.continuePay(e.currentTarget.dataset.no) },
    cancelOrderByNo(e) { store.cancelOrderByNo(e.currentTarget.dataset.no) },
    viewOrderTrip(e) { store.viewOrderTrip(e.currentTarget.dataset.no) },
    openRefundModal(e) { store.openRefundModal(e.currentTarget.dataset.no) },
    closeLogin() { store.closeLogin() },
    closeProfileEditor() { store.closeProfileEditor() },
    onProfileNickname(e) { store.setProfileNickname(e.detail.value) },
    onProfileCity(e) { store.setProfileCity(e.detail.value) },
    pickProfileGender(e) { store.setProfileGender(e.currentTarget.dataset.gender) },
    onProfileChooseAvatar(e) { store.applyChosenAvatar(e) },
    submitProfile() { store.submitProfile() },
    onLoginPhone(e) {
      this.setData({ loginPhone: e.detail.value })
      store.setLoginPhone(e.detail.value)
    },
    onLoginSms(e) {
      this.setData({ loginSms: e.detail.value })
      store.setLoginSms(e.detail.value)
    },
    sendDemoSms() { store.sendDemoSms() },
    submitPhoneLogin() { store.submitPhoneLogin() },
    submitWxLogin() { store.submitWxLogin() },
    onWxChooseAvatar(e) {
      store.submitWxLogin(e)
    },
    closeRefundModal() { store.closeRefundModal() },
    pickRefundReason(e) { store.pickRefundReason(e.currentTarget.dataset.reason) },
    submitRefund() { store.submitRefund() },
    openUnboxModal(e) { store.openUnboxModal(e.currentTarget.dataset.id) },
  },
})
