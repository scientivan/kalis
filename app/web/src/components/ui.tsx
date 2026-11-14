'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode, type FormEvent } from 'react';
import { useMock, newId } from '../lib/store';
import { money, type Method, type Run, type Scenario, type RouteModel, type Bounty } from '../lib/domain';

export type FormValues = Record<string, string>;
export function Form({
  children,
  onSave,
  onChange,
  label = 'Save changes',
}: {
  children: ReactNode;
  onSave: (v: FormValues) => void;
  onChange?: (e: FormEvent<HTMLFormElement>) => void;
  label?: string;
}) {
  return (
    <form
      onChange={onChange}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave(Object.fromEntries([...f].map(([k, v]) => [k, typeof v === 'string' ? v : v.name])));
      }}
    >
      {children}
      <div className="form-actions">
        <button className="button primary" type="submit">
          {label}
        </button>
      </div>
    </form>
  );
}
export function Field({
  name,
  label,
  value = '',
  type = 'text',
  options,
  required = true,
  children,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  options?: string[];
  required?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      {options ? (
        <select id={name} name={name} defaultValue={value || options[0]}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={name} name={name} defaultValue={value} required={required} maxLength={2500} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={type === 'file' ? undefined : value}
          required={required}
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? '0.01' : undefined}
          maxLength={type === 'text' ? 200 : undefined}
          accept={type === 'file' ? '.pdf,.csv,.json,.txt,.png,.jpg,.jpeg' : undefined}
        />
      )}{' '}
      {children && <small>{children}</small>}
    </div>
  );
}
export function Check({
  name,
  children,
  checked = false,
  required = false,
}: {
  name: string;
  children: ReactNode;
  checked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="check-field">
      <input type="checkbox" name={name} defaultChecked={checked} required={required} />
      <span>{children}</span>
    </label>
  );
}
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="fact-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="panel">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="market-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Go({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={'button ' + (secondary ? 'secondary' : 'primary')} href={to}>
      {children}
    </Link>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <p>{children}</p>
    </div>
  );
}
export function Status({ children }: { children: ReactNode }) {
  return <span className="plain-status">{children}</span>;
}
export function Cover({ method, small = false }: { method: Method; small?: boolean }) {
  return (
    <Image
      unoptimized
      src={'/covers/' + method.cover + '.jpg'}
      alt=""
      width={small ? 80 : 160}
      height={small ? 80 : 160}
      className={small ? 'small-cover' : 'method-cover'}
    />
  );
}
export function Rating({ method }: { method: Method }) {
  const n = method.reviews.length;
  return (
    <span className="market-rating">
      <span aria-hidden="true">☆</span>{' '}
      {n ? (method.reviews.reduce((v, r) => v + r.rating, 0) / n).toFixed(1) + ' / 5' : 'No ratings yet'}{' '}
      <small>({n} mock reviews)</small>
    </span>
  );
}
export function Tabs({ items }: { items: [string, string][] }) {
  const path = usePathname();
  return (
    <nav className="market-sections" aria-label="Page sections">
      {items.map(([label, to]) => (
        <Link href={to} key={to} aria-current={path === to ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
export const workspaceTabs: [string, string][] = [
  ['Overview', '/workspace'],
  ['All work', '/workspace/all'],
  ['Files', '/workspace/files'],
  ['Memory', '/workspace/memory'],
  ['Private test cases', '/workspace/permissions'],
];
export const communityTabs: [string, string][] = [
  ['Overview', '/community'],
  ['Problems', '/community/issues'],
  ['Proposals', '/community/proposals'],
  ['Bounties', '/community/bounties'],
  ['Contributions', '/community/contributions'],
  ['Shared fund', '/community/fund'],
];
