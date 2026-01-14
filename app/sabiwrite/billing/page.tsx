import { redirect } from 'next/navigation'

export default function SabiWriteBillingPage() {
  redirect('/account/wallet?service=sabiwrite')
}