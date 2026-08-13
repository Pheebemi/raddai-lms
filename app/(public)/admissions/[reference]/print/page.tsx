'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { admissionsApi, Application } from '@/lib/admissions-api';
import { getFeeSchedule } from '@/lib/admission-fee-schedule';
import { Loader2, Printer, AlertCircle, CreditCard, PencilLine } from 'lucide-react';

const showDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

/**
 * The printable application form. Reachable any number of times once the
 * application has been submitted — parents lose paper, and reprinting should
 * never mean re-applying.
 */
export default function PrintApplicationPage() {
  const params = useParams();
  const reference = String(params.reference);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    admissionsApi.get(reference)
      .then(setApplication)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !application) {
    return (
      <Notice
        icon={<AlertCircle className="h-6 w-6 text-destructive mx-auto mb-3" />}
        title="We could not find that form"
        body={error}
        action={<Link href="/admissions/retrieve">Search for my form</Link>}
      />
    );
  }

  if (!application.paid_at) {
    return (
      <Notice
        icon={<CreditCard className="h-6 w-6 text-primary mx-auto mb-3" />}
        title="Payment not completed"
        body={`The application fee for ${application.reference} has not been received, so there is nothing to print yet.`}
        action={
          <Link href={`/admissions/apply?reference=${application.reference}`}>
            Pay application fee
          </Link>
        }
      />
    );
  }

  if (!application.submitted_at) {
    return (
      <Notice
        icon={<PencilLine className="h-6 w-6 text-primary mx-auto mb-3" />}
        title="Form not completed"
        body="Your payment came through, but the form has not been submitted yet. Finish it and you will be able to print."
        action={<Link href={`/admissions/${reference}`}>Continue filling the form</Link>}
      />
    );
  }

  const schedule = getFeeSchedule(application.level);

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; size: A4; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admissions" className="text-sm text-muted-foreground hover:text-primary">
            Admissions
          </Link>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white text-black p-8 sm:p-10 my-6 print:my-0 shadow-sm print:shadow-none">
        <header className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Laazeere Academy"
              className="w-20 h-20 object-contain shrink-0"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight">
                Laazeere Academy
              </h1>
              <p className="text-xs italic">Education is Power</p>
              <p className="text-xs mt-1">
                Samunaka Sabon Gari, Jalingo, Taraba State, Nigeria
              </p>
              <p className="text-xs">
                08066115707, 09060405589, 08039305511 · info@laazeereacademy.com
              </p>
            </div>
          </div>
          <h2 className="text-base font-semibold mt-4 uppercase text-center border-t border-neutral-300 pt-3">
            Application for Admission
          </h2>
        </header>

        <div className="flex justify-between items-start gap-6 mb-6">
          <div className="text-sm space-y-1">
            <p><strong>Reference:</strong> {application.reference}</p>
            <p><strong>Session:</strong> {application.academic_year_name}</p>
            <p><strong>Class applied for:</strong> {application.level_display}</p>
            <p><strong>Submitted:</strong> {showDate(application.submitted_at)}</p>
          </div>
          <div className="w-[35mm] h-[45mm] border border-black shrink-0 flex items-center justify-center overflow-hidden">
            {application.passport_photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={application.passport_photo} alt="Passport" className="w-full h-full object-cover" />
              : <span className="text-[9px] text-center px-1">Affix passport photograph</span>}
          </div>
        </div>

        <Section title="Applicant">
          <Row label="Full name" value={application.full_name} />
          <Row label="Date of birth" value={showDate(application.date_of_birth)} />
          <Row label="Gender" value={application.gender} capitalize />
          <Row label="Nationality" value={application.nationality} />
          <Row label="State of origin" value={application.state_of_origin} />
          <Row label="Local government" value={application.lga} />
          <Row label="Religion" value={application.religion} />
          <Row label="Blood group" value={application.blood_group} />
          <Row label="Genotype" value={application.genotype} />
          <Row label="Home address" value={application.home_address} wide />
          <Row label="Medical conditions" value={application.medical_info} wide />
        </Section>

        <Section title="Previous school">
          <Row label="School attended" value={application.previous_school} />
          <Row label="Last class" value={application.previous_class} />
          <Row label="Reason for leaving" value={application.reason_for_leaving} wide />
        </Section>

        <Section title="Parent / Guardian">
          <Row label="Full name" value={application.guardian_name} />
          <Row label="Relationship" value={application.guardian_relationship} />
          <Row label="Phone number" value={application.guardian_phone} />
          <Row label="Father's phone" value={application.father_phone} />
          <Row label="Mother's phone" value={application.mother_phone} />
          <Row label="Email" value={application.guardian_email} />
          <Row label="Occupation" value={application.guardian_occupation} />
          <Row label="Address" value={application.guardian_address} wide />
        </Section>

        <Section title="Payment">
          <Row label="Application fee" value={`NGN ${application.fee_amount}`} />
          <Row label="Date paid" value={showDate(application.paid_at)} />
        </Section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3 print:break-after-avoid">
            School Fees — {schedule.schoolName}
          </h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {schedule.items.map((row, i) => (
                <tr
                  key={i}
                  className={`print:break-inside-avoid ${row.bold ? 'font-bold border-t border-neutral-400' : ''}`}
                >
                  <td className="py-1 pr-2">{row.label}</td>
                  <td className="py-1 pr-2 text-neutral-500">{row.period}</td>
                  <td className="py-1 text-right">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="text-sm font-semibold mt-4 mb-2 print:break-after-avoid">{schedule.totalsTitle}</h4>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {schedule.totals.map((row, i) => (
                <tr key={i} className="print:break-inside-avoid">
                  <td className="py-1 pr-2">{row.label}</td>
                  <td className="py-1 text-right font-medium">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-neutral-600 mt-3">
            Account Number: <strong>{schedule.bankAccount}</strong> · {schedule.bankName} ·{' '}
            {schedule.schoolName}
          </p>
        </section>

        <section className="mb-6 print:break-inside-avoid">
          <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3 print:break-after-avoid">
            Notes &amp; requirements
          </h3>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {schedule.notes.map((note, i) => <li key={i} className="print:break-inside-avoid">{note}</li>)}
          </ul>
        </section>

        <section className="mb-6 print:break-inside-avoid">
          <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3 print:break-after-avoid">
            {schedule.textbooksTitle}
          </h3>
          <ol className="text-sm space-y-1 list-decimal pl-5">
            {schedule.textbooks.map((book, i) => <li key={i} className="print:break-inside-avoid">{book}</li>)}
          </ol>
        </section>

        <section className="mb-6 print:break-inside-avoid">
          <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3 print:break-after-avoid">
            School rules and regulations
          </h3>
          <ol className="text-sm space-y-2 list-decimal pl-5">
            {schedule.rules.map((rule, i) => <li key={i} className="print:break-inside-avoid">{rule}</li>)}
          </ol>
        </section>

        <section className="mb-6 print:break-inside-avoid">
          <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3 print:break-after-avoid">
            Undertaking
          </h3>
          <ul className="text-sm space-y-1.5 list-none">
            <li className="print:break-inside-avoid">
              [{application.agrees_to_school_authority ? 'X' : ' '}] I agree to raise any
              concern with the school authority first, rather than confronting staff
              directly or involving outside parties such as the police.
            </li>
            <li className="print:break-inside-avoid">
              [{application.confirms_rules_read ? 'X' : ' '}] I confirm that I have read
              and understood the school&apos;s rules, regulations and admission conditions.
            </li>
          </ul>
        </section>

        <div className="print:break-inside-avoid">
          <div className="mt-6 pt-4 border-t border-black grid grid-cols-2 gap-10 text-sm">
            <div>
              <div className="border-b border-black h-8" />
              <p className="mt-1">Parent / Guardian signature &amp; date</p>
            </div>
            <div>
              <div className="border-b border-black h-8" />
              <p className="mt-1">For office use — received by</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-300 text-[10px] text-center text-neutral-600 space-y-1">
            <p>
              This form was generated from an online application. Bring the printed copy,
              together with the child&apos;s birth certificate or declaration of age, recent
              passport photographs, and the relevant testimonial (First School Leaving
              Certificate or BECE, where applicable), when visiting the school.
            </p>
            <p>
              Admissions office: Samunaka Sabon Gari, Jalingo, Taraba State ·
              08066115707, 09060405589, 08039305511 · Mon – Fri, 8:00 AM – 4:00 PM
            </p>
            <p>Reference {application.reference} · Printed {new Date().toLocaleDateString('en-NG')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-bold uppercase bg-neutral-100 print:bg-neutral-100 px-2 py-1 border border-neutral-300 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {children}
      </div>
    </section>
  );
}

function Row({
  label, value, wide, capitalize,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2 flex gap-2' : 'flex gap-2'}>
      <span className="text-neutral-600 shrink-0">{label}:</span>
      <span className={`font-medium border-b border-dotted border-neutral-400 flex-1 ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function Notice({
  icon, title, body, action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-10">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{body}</p>
          <Button asChild className="mt-5">{action}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
