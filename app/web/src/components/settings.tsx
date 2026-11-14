'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode, type FormEvent } from 'react';
import { useMock, newId } from '../lib/store';
import { money, type Method, type Run, type Scenario, type RouteModel, type Bounty } from '../lib/domain';
import {
  Form,
  Field,
  Check,
  Facts,
  Panel,
  Heading,
  Go,
  Empty,
  Status,
  Cover,
  Rating,
  Tabs,
  workspaceTabs,
  communityTabs,
  FormValues,
} from './ui';

export function Settings({ page }: { page: string }) {
  const { state, command, reset } = useMock();
  const [confirm, setConfirm] = useState(false),
    [reduced, setReduced] = useState(false);
  const router = useRouter();
  if (page === 'account')
    return (
      <>
        <Heading
          title="Account"
          description="One mock account can buy methods, create listings and contribute."
        />
        <Panel title="Profile">
          <Form onSave={(v) => command({ type: 'PROFILE', name: v.name })}>
            <Field name="name" label="Display name" value={state.name} />
          </Form>
          <p>Authentication will be integrated later. This demo does not collect login credentials.</p>
        </Panel>
      </>
    );
  if (page === 'connections')
    return (
      <>
        <Heading
          title="Connections"
          description="Mock read-only service access. No credentials are collected."
        />
        <Panel title="Connected services">
          {(['broker', 'portal'] as const).map((service) => (
            <section className="settings-row" key={service}>
              <div>
                <h3>{service === 'broker' ? 'Portfolio broker' : 'Procurement portal'}</h3>
                <p>
                  {service === 'broker'
                    ? 'Read synthetic holdings. No trading or withdrawals.'
                    : 'Read mock tender documents and prepare a bid. External sending requires a separate approval.'}
                </p>
              </div>
              {state.connections[service] ? (
                <div>
                  <Facts
                    rows={[
                      ['Allowed access', state.connectionScopes[service].scope],
                      ['Expires', state.connectionScopes[service].expires],
                    ]}
                  />
                  <button
                    className="button secondary"
                    onClick={() => command({ type: 'CONNECT', service, connected: false })}
                  >
                    Revoke mock access
                  </button>
                </div>
              ) : (
                <Form
                  label="Connect mock"
                  onSave={(v) =>
                    command({ type: 'CONNECT', service, connected: true, scope: v.scope, expires: v.expires })
                  }
                >
                  <Field name="scope" label="Allowed access" value={state.connectionScopes[service].scope} />
                  <Field name="expires" label="Access expires" type="date" />
                  <p>No password or token is collected in this demo.</p>
                </Form>
              )}
            </section>
          ))}
        </Panel>
      </>
    );
  return (
    <>
      <Heading title="Permissions & preferences" />
      <Panel title="Data and permissions">
        <Go to="/workspace/permissions" secondary>
          Inspect private test permissions
        </Go>
        <p>
          Production retention, deletion and model-training policies are not defined by this mock. Test
          permission never implies training consent.
        </p>
        <h3>Motion</h3>
        <label className="check-field">
          <input
            type="checkbox"
            checked={reduced}
            onChange={(e) => {
              setReduced(e.target.checked);
              document.documentElement.classList.toggle('reduce-motion', e.target.checked);
            }}
          />
          Reduce motion
        </label>
        <h3>Reset mock data</h3>
        <p>Reset removes this demo’s saved browser state. It does not delete backend data.</p>
        {!confirm ? (
          <button className="button secondary" onClick={() => setConfirm(true)}>
            Reset demo…
          </button>
        ) : (
          <div className="panel-actions">
            <button
              className="button primary"
              onClick={() => {
                reset();
                setConfirm(false);
                router.push('/workspace');
              }}
            >
              Confirm reset
            </button>
            <button className="button secondary" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        )}
      </Panel>
    </>
  );
}
