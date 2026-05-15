'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Users, BookOpen, Trophy,
  MapPin, Phone, Mail, Clock, Shield, Heart,
  ArrowRight, CheckCircle, Star, Award, Sun, Moon, Target, Lightbulb,
} from 'lucide-react';

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0">
                <Image src="/logo.png" alt="Laazeere Academy" width={40} height={40} className="object-contain w-full h-full" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground leading-tight">Laazeere Academy</p>
                <p className="text-xs text-muted-foreground italic">Education is Power</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center">
              {[
                { label: 'About', href: '#about' },
                { label: 'Programs', href: '#programs' },
                { label: 'Contact', href: '#contact' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">
                  Access Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-primary"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-20 md:pb-24">
          <span className="inline-block border border-white/30 text-white text-xs font-medium px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
            Education is Power
          </span>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-4 max-w-3xl">
            Laazeere Academy
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-2 max-w-xl leading-relaxed">
            Raising a generation capable of building new innovation — not just repeating what others have done.
          </p>
          <p className="text-sm text-white/60 mb-8">Samunaka Sabon Gari, Jalingo, Taraba State</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Access Portal
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild size="lg" variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              <a href="#about">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Users, label: '500+ Students' },
              { icon: GraduationCap, label: '30+ Qualified Teachers' },
              { icon: Award, label: '98% Pass Rate' },
              { icon: Star, label: 'WAEC & NECO Center' },
              { icon: BookOpen, label: 'Nursery to SS3' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 border border-border bg-background rounded-full px-4 py-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block border border-primary/30 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                About Us
              </span>
              <h2 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-6">
                Building innovators, not imitators
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Laazeere Academy is an educational institution that focuses on raising a young generation
                capable of building new innovation — not just repeating what others have done. We are
                located in Samunaka Sabon Gari, Jalingo, Taraba State.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['Modern Facilities', 'Qualified Teachers', 'Digital Learning', 'Sports & Arts', 'Safe Environment', 'Character Development'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent-foreground shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Lightbulb,
                  title: 'Our About',
                  desc: 'Raising a young generation capable of building new innovation, not just repeating what others have done.',
                },
                {
                  icon: Target,
                  title: 'Our Vision',
                  desc: 'Creating relevant learning opportunities — inside and outside the classroom — to develop knowledge, critical thinking and character.',
                },
                {
                  icon: Heart,
                  title: 'Our Mission',
                  desc: 'Preparing all students to become lifelong learners and responsible citizens, in partnership with families and community.',
                },
                {
                  icon: Shield,
                  title: 'Our Motto',
                  desc: 'Education is Power — we believe learning is the greatest tool for transforming lives and communities.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-secondary rounded-2xl p-5 flex flex-col">
                  <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <span className="inline-block border border-primary/30 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Academic Programs
            </span>
            <h2 className="text-4xl font-semibold text-foreground tracking-tight">
              Education for every stage
            </h2>
            <p className="text-base text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              From early childhood through senior secondary — a seamless educational journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Nursery & Primary',
                age: 'Ages 3–11 years',
                items: ['Play-based learning', 'Basic literacy & numeracy', 'Social skills development', 'Creative arts and music'],
              },
              {
                icon: BookOpen,
                title: 'Junior Secondary',
                age: 'Ages 12–14 · JSS 1–3',
                items: ['Core subjects curriculum', 'Computer studies', 'Practical skills', 'Career guidance'],
              },
              {
                icon: GraduationCap,
                title: 'Senior Secondary',
                age: 'Ages 15–17 · SS 1–3',
                items: ['WAEC/NECO preparation', 'Advanced sciences & maths', 'Entrepreneurship education', 'University preparation'],
              },
            ].map(({ icon: Icon, title, age, items }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{age}</p>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-accent-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal CTA */}
      <section className="py-20 bg-accent">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="inline-block border border-accent-foreground/30 text-accent-foreground text-xs font-medium px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Student & Parent Portal
          </span>
          <h2 className="text-4xl font-semibold text-accent-foreground tracking-tight mb-4">
            Everything you need, in one place
          </h2>
          <p className="text-base text-accent-foreground/80 leading-relaxed mb-8 max-w-2xl mx-auto">
            Access results, fee payments, class rankings, and announcements.
            Students, parents, and staff each have a dedicated dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90">
              <Link href="/login">
                Login to Portal
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10">
              <a href="#contact">Contact Admissions</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <span className="inline-block border border-primary/30 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                Contact Us
              </span>
              <h2 className="text-4xl font-semibold text-foreground tracking-tight mb-4">
                Get in touch
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Visit our administrative office for admissions, inquiries, or any
                questions about our programs and facilities.
              </p>
              <div className="space-y-3">
                {[
                  { icon: MapPin, label: 'Location', value: 'Samunaka Sabon Gari, Jalingo, Taraba State, Nigeria' },
                  { icon: Phone, label: 'Phone', value: '08066115707, 09060405589, 08039305511' },
                  { icon: Mail, label: 'Email', value: 'info@laazeereacademy.com' },
                  { icon: Clock, label: 'Office Hours', value: 'Mon – Fri: 8:00 AM – 4:00 PM' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 bg-muted rounded-2xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to join our community?</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Log in to your portal or reach out to our admissions office to schedule a campus visit.
              </p>
              <Button asChild size="lg" className="w-full mb-3">
                <Link href="/login">
                  Login to Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="tonal" className="w-full">
                <Phone className="h-4 w-4" />
                Call Admissions
              </Button>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Contact our admissions office to learn about our enrollment process
                  and schedule a campus visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Laazeere Academy"
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold">Laazeere Academy</p>
                  <p className="text-xs opacity-60 italic">Education is Power</p>
                </div>
              </div>
              <p className="text-sm opacity-60 mb-4 leading-relaxed">
                Raising a young generation capable of building new innovation in the heart of Taraba State.
              </p>
              <div className="flex flex-wrap gap-2">
                {['WAEC Approved', 'NECO Center', 'Digital Learning'].map(badge => (
                  <span key={badge} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{badge}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-4">Quick Links</p>
              <ul className="space-y-2 text-sm opacity-60">
                {[
                  { label: 'Student Portal', href: '/login' },
                  { label: 'Parent Portal', href: '/login' },
                  { label: 'Staff Portal', href: '/login' },
                  { label: 'Contact Us', href: '#contact' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="hover:opacity-100 transition-opacity">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-4">Contact</p>
              <ul className="space-y-2 text-sm opacity-60">
                <li>08066115707</li>
                <li>09060405589</li>
                <li>08039305511</li>
                <li>Samunaka Sabon Gari</li>
                <li>Jalingo, Taraba State</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-2 text-sm opacity-60">
            <p>© 2026 Laazeere Academy, Jalingo. All rights reserved.</p>
            <p>Education is Power</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
