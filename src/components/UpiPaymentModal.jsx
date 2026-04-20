import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import './UpiPaymentModal.css'

const isMobileDevice = () =>
  typeof navigator !== 'undefined'
  && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

function UpiPaymentModal({
  isOpen,
  onClose,
  creatorName,
  creatorUpiId,
  amount,
  cups,
  onPaymentVerified,
}) {
  const [step, setStep] = useState('payment')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [refError, setRefError] = useState('')
  const [isMobile] = useState(isMobileDevice)
  const [lockedAmount, setLockedAmount] = useState(amount)
  const [lockedCups, setLockedCups] = useState(cups)
  const deepLinkOpened = useRef(false)

  /* Lock amount and cups when modal opens so parent form reset doesn't affect display */
  useEffect(() => {
    if (isOpen) {
      setLockedAmount(amount)
      setLockedCups(cups)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const upiLink = `upi://pay?pa=${encodeURIComponent(creatorUpiId)}&pn=${encodeURIComponent(creatorName)}&am=${lockedAmount}&cu=INR`

  /* Generate QR data-URL for desktop */
  useEffect(() => {
    if (!isOpen || isMobile) {
      return
    }

    QRCode.toDataURL(upiLink, {
      width: 280,
      margin: 2,
      color: { dark: '#1c1917', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [isOpen, upiLink, isMobile])

  /* Open UPI deep link on mobile (once per modal open) */
  useEffect(() => {
    if (isOpen && isMobile && step === 'payment' && !deepLinkOpened.current) {
      deepLinkOpened.current = true
      window.location.href = upiLink
    }
  }, [isOpen, isMobile, step, upiLink])

  /* Reset state when the modal closes */
  useEffect(() => {
    if (!isOpen) {
      setStep('payment')
      setQrDataUrl('')
      setReferenceNumber('')
      setRefError('')
      deepLinkOpened.current = false
    }
  }, [isOpen])

  /* Auto-close the success overlay after 3 seconds */
  useEffect(() => {
    if (step !== 'success') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      onClose()
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [step, onClose])

  const handleVerify = () => {
    const trimmed = referenceNumber.trim()

    if (!/^\d{12}$/.test(trimmed)) {
      setRefError('Please enter a valid 12-digit UPI reference number')
      return
    }

    setRefError('')
    onPaymentVerified(trimmed)
    setStep('success')
  }

  if (!isOpen) {
    return null
  }

  /* ── Success overlay ── */
  if (step === 'success') {
    return (
      <div
        className="upi-success-overlay"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') onClose()
        }}
        role="button"
        tabIndex={0}
      >
        <div className="upi-success-circle" />

        <div className="upi-success-content">
          <svg className="upi-success-check" viewBox="0 0 52 52" fill="none">
            <circle
              cx="26"
              cy="26"
              r="24"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
            />
            <path
              d="M15 27l7 7 15-15"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p className="upi-success-text">Payment Successful</p>
          <p className="upi-success-subtext">
            ₹{lockedAmount} sent to {creatorName}
          </p>
          <p className="upi-success-close-hint">Tap anywhere to close</p>
        </div>
      </div>
    )
  }

  /* ── Payment / Verify modal ── */
  return (
    <div className="upi-modal-backdrop" onClick={onClose}>
      <div
        className="upi-modal-card w-full max-w-md rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-2xl shadow-stone-900/10 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Step: Payment ── */}
        {step === 'payment' && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {isMobile ? 'UPI Payment' : 'Scan & Pay'}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Support {creatorName}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            {/* Amount badge */}
            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 px-5 py-4">
              <span className="text-3xl font-bold tracking-tight text-stone-950">
                ₹{lockedAmount}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-700 shadow-sm">
                {lockedCups} chai{lockedCups > 1 ? 's' : ''}
              </span>
            </div>

            {isMobile ? (
              /* Mobile: deep-link instruction */
              <div className="mt-6 space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="5" y="2" width="14" height="20" rx="3" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
                <p className="text-base font-medium text-stone-700">
                  Complete the payment in your UPI app
                </p>
                <p className="text-sm text-stone-500">
                  A payment request has been opened in your UPI app. After
                  completing the payment, return here and tap the button below.
                </p>
              </div>
            ) : (
              /* Desktop: QR code */
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-stone-600">
                  Scan this QR code with any UPI app
                </p>

                {qrDataUrl ? (
                  <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                    <img
                      src={qrDataUrl}
                      alt="UPI payment QR code"
                      className="h-[240px] w-[240px]"
                    />
                  </div>
                ) : (
                  <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
                    Generating QR code…
                  </div>
                )}

                <p className="text-xs text-stone-400">Pay to: {creatorUpiId}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('verify')}
              className="mt-6 w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              I've completed the payment
            </button>
          </>
        )}

        {/* ── Step: Verify ── */}
        {step === 'verify' && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Verification
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Verify your payment
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-600">
              Enter the 12-digit UPI transaction reference number from your
              payment confirmation.
            </p>

            <div className="mt-6 space-y-2">
              <label
                htmlFor="upi-ref-input"
                className="text-sm font-medium text-stone-700"
              >
                UPI Reference Number
              </label>

              <input
                id="upi-ref-input"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value.replace(/\D/g, ''))
                  setRefError('')
                }}
                placeholder="000000000000"
                className={`w-full rounded-2xl border bg-stone-50 px-4 py-3 text-base tracking-widest text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:bg-white focus:ring-4 ${
                  refError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-300 focus:border-amber-500 focus:ring-amber-100'
                }`}
              />

              {refError ? (
                <p className="text-sm text-red-500">{refError}</p>
              ) : null}

              <p className="text-xs text-stone-400">
                You can find this in your UPI app's payment history
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={referenceNumber.length < 12}
              className="mt-6 w-full rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify Payment
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default UpiPaymentModal
