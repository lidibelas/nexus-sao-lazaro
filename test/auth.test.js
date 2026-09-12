import test from 'node:test';
import assert from 'node:assert/strict';
import { accessState } from '../src/auth.js';

test('accessState identifies an unauthenticated visitor', () => {
  assert.deepEqual(accessState(null, null), { status: 'signed-out' });
});

test('accessState blocks an authenticated person without an editorial profile', () => {
  assert.deepEqual(accessState({ id: 'u-1' }, null), { status: 'not-authorized' });
});

test('accessState authorizes an active editorial profile', () => {
  assert.deepEqual(
    accessState({ id: 'u-1' }, { user_id: 'u-1', role: 'Editora-chefe', active: true }),
    { status: 'authorized', role: 'Editora-chefe' },
  );
});

test('accessState blocks an inactive profile', () => {
  assert.deepEqual(
    accessState({ id: 'u-1' }, { user_id: 'u-1', role: 'Editora', active: false }),
    { status: 'not-authorized' },
  );
});

test('accessState rejects a profile linked to a different account', () => {
  assert.deepEqual(
    accessState({ id: 'u-1' }, { user_id: 'u-2', role: 'Editora-chefe', active: true }),
    { status: 'not-authorized' },
  );
});
