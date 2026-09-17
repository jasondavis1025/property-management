import Link from "next/link";
import { HomeHashScroll } from "@/components/home-hash-scroll";
import { ScrollToIdLink } from "@/components/scroll-to-id-link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-950 text-white">
      <HomeHashScroll />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="text-lg font-semibold tracking-tight">Oakview Apartments</span>
        <Link
          href="/login"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
        >
          Resident login
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-200">
            Resident portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Everything you need as a tenant — in one secure place.
          </h1>
          <p className="mt-4 text-lg text-teal-100/90">
            Pay rent, submit maintenance requests, download documents, read
            announcements, and message the office without phone tag or paper forms.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-teal-400 px-5 py-3 text-sm font-semibold text-teal-950 hover:bg-teal-300"
            >
              Sign in to portal
            </Link>
            <ScrollToIdLink
              id="features"
              className="rounded-lg border border-white/20 px-5 py-3 text-sm font-medium hover:bg-white/5 md:hidden"
            >
              See features
            </ScrollToIdLink>
          </div>
        </div>

        <section
          id="features"
          className="mt-16 scroll-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            ["Pay rent online", "View balances, pay by card or bank, and access receipts."],
            ["Maintenance", "Submit requests and track status from submission to completion."],
            ["Documents", "Lease, notices, and policies available 24/7."],
            ["Messaging", "Secure inbox with your property management team."],
            ["Announcements", "Pool closures, package notices, and community news."],
            ["Profile", "Keep contact info up to date for emergencies and billing."],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h2 className="font-semibold text-teal-100">{title}</h2>
              <p className="mt-2 text-sm text-teal-50/80">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
