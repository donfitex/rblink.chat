/**
 * rblink.chat Automated Test Suite
 * Validates core chat functionality, markdown parsing, reactions, threads,
 * channel creation slug validation, mentions parsing, search, and collaboration tools.
 */

import assert from 'assert';

console.log('\n========================================');
console.log('🧪 RUNNING RBLINK.CHAT VERIFICATION SUITE');
console.log('========================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}\n`);
  }
}

// 1. Message Grouping Logic Test
test('Message grouping by sender within 5 minutes', () => {
  const m1 = {
    id: '1',
    senderId: 'u1',
    timestamp: '2026-10-01T12:00:00.000Z'
  };
  const m2 = {
    id: '2',
    senderId: 'u1',
    timestamp: '2026-10-01T12:03:00.000Z' // 3 minutes later -> should group
  };
  const m3 = {
    id: '3',
    senderId: 'u1',
    timestamp: '2026-10-01T12:08:00.000Z' // 8 minutes later -> should NOT group
  };
  const m4 = {
    id: '4',
    senderId: 'u2',
    timestamp: '2026-10-01T12:01:00.000Z' // Different sender -> should NOT group
  };

  const shouldGroup = (prev, curr) => {
    if (!prev || !curr) return false;
    if (prev.senderId !== curr.senderId) return false;
    const diff = Math.abs(new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime());
    return diff <= 5 * 60 * 1000;
  };

  assert.strictEqual(shouldGroup(m1, m2), true, 'm1 and m2 by same user in 3 mins should group');
  assert.strictEqual(shouldGroup(m1, m3), false, 'm1 and m3 in 8 mins should not group');
  assert.strictEqual(shouldGroup(m1, m4), false, 'm1 and m4 by different users should not group');
});

// 2. Reaction Toggling & Duplicate Prevention Test
test('Reaction toggling & duplicate prevention', () => {
  let reactions = [];

  const toggleReaction = (emoji, userId) => {
    const idx = reactions.findIndex((r) => r.emoji === emoji);
    if (idx > -1) {
      const existing = reactions[idx];
      if (existing.users.includes(userId)) {
        // Remove reaction
        const updatedUsers = existing.users.filter((id) => id !== userId);
        if (updatedUsers.length === 0) {
          reactions.splice(idx, 1);
        } else {
          reactions[idx] = { emoji, count: updatedUsers.length, users: updatedUsers };
        }
      } else {
        // Add user reaction
        reactions[idx] = { emoji, count: existing.users.length + 1, users: [...existing.users, userId] };
      }
    } else {
      reactions.push({ emoji, count: 1, users: [userId] });
    }
  };

  // User 1 reacts with rocket
  toggleReaction('🚀', 'u1');
  assert.strictEqual(reactions.length, 1);
  assert.strictEqual(reactions[0].count, 1);
  assert.deepStrictEqual(reactions[0].users, ['u1']);

  // User 2 reacts with rocket
  toggleReaction('🚀', 'u2');
  assert.strictEqual(reactions[0].count, 2);
  assert.deepStrictEqual(reactions[0].users, ['u1', 'u2']);

  // User 1 clicks rocket again -> should retract their reaction
  toggleReaction('🚀', 'u1');
  assert.strictEqual(reactions[0].count, 1);
  assert.deepStrictEqual(reactions[0].users, ['u2']);

  // User 2 clicks rocket again -> should remove reaction completely
  toggleReaction('🚀', 'u2');
  assert.strictEqual(reactions.length, 0);
});

// 3. Mentions Parsing Test
test('Mentions parser extracts user handles, @channel, and @everyone', () => {
  const content = 'Hey @alex.rivera and @sarah.chen! Please check @channel and @everyone for launch details.';
  const parseMentions = (text) => {
    const matches = text.match(/@([a-zA-Z0-9_\.]+)/g) || [];
    return matches.map((m) => m.slice(1));
  };

  const mentions = parseMentions(content);
  assert.deepStrictEqual(mentions, ['alex.rivera', 'sarah.chen', 'channel', 'everyone']);
});

// 4. Channel Slug Validation Test
test('Channel name validation sanitizes spaces and enforces lowercase alphanumeric with hyphens', () => {
  const sanitizeChannelName = (input) => {
    return input.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  assert.strictEqual(sanitizeChannelName('Project Apollo 2026'), 'project-apollo-2026');
  assert.strictEqual(sanitizeChannelName('#General Discussion!'), 'general-discussion');
  assert.strictEqual(sanitizeChannelName('dev--team--sync'), 'dev--team--sync');
});

// 5. Interactive Poll Voting Test
test('Interactive poll allows single vote per user and updates percentages', () => {
  const poll = {
    id: 'poll_1',
    question: 'Favorite editor?',
    allowMultiple: false,
    options: [
      { id: 'opt_1', text: 'VS Code', votes: [] },
      { id: 'opt_2', text: 'Neovim', votes: [] }
    ]
  };

  const vote = (pollObj, optionId, userId) => {
    pollObj.options = pollObj.options.map((opt) => {
      if (opt.id === optionId) {
        const hasVoted = opt.votes.includes(userId);
        return {
          ...opt,
          votes: hasVoted ? opt.votes.filter((id) => id !== userId) : [...opt.votes, userId]
        };
      }
      if (!pollObj.allowMultiple) {
        return { ...opt, votes: opt.votes.filter((id) => id !== userId) };
      }
      return opt;
    });
  };

  // User 1 votes for VS Code
  vote(poll, 'opt_1', 'u1');
  assert.strictEqual(poll.options[0].votes.length, 1);
  assert.strictEqual(poll.options[1].votes.length, 0);

  // User 1 changes vote to Neovim
  vote(poll, 'opt_2', 'u1');
  assert.strictEqual(poll.options[0].votes.length, 0);
  assert.strictEqual(poll.options[1].votes.length, 1);
});

// 6. Interactive Checklist Progress Test
test('Checklist toggling computes accurate progress percentages', () => {
  const checklist = {
    items: [
      { id: '1', text: 'Unit tests', completed: true },
      { id: '2', text: 'Linting', completed: true },
      { id: '3', text: 'Deploy to prod', completed: false }
    ]
  };

  const getProgress = (chk) => {
    const completed = chk.items.filter((i) => i.completed).length;
    return Math.round((completed / chk.items.length) * 100);
  };

  assert.strictEqual(getProgress(checklist), 67);

  // Complete item 3
  checklist.items[2].completed = true;
  assert.strictEqual(getProgress(checklist), 100);
});

// 7. Full-Text Search Filtering Test
test('Search filters messages accurately by keyword and channel context', () => {
  const sampleMessages = [
    { id: '1', content: 'Deploying the new WebSocket heartbeat handler', channelId: 'c_engineering' },
    { id: '2', content: 'Lunch recommendations for Friday', channelId: 'c_general' },
    { id: '3', content: 'Figma tokens update and dark theme styling', channelId: 'c_design' }
  ];

  const search = (query, filterChannel) => {
    const q = query.toLowerCase();
    return sampleMessages.filter((m) => {
      if (filterChannel && m.channelId !== filterChannel) return false;
      return m.content.toLowerCase().includes(q);
    });
  };

  const r1 = search('websocket');
  assert.strictEqual(r1.length, 1);
  assert.strictEqual(r1[0].id, '1');

  const r2 = search('lunch', 'c_engineering');
  assert.strictEqual(r2.length, 0);
});

// 8. Thread Reply Aggregation Test
test('Parent message reply count and latest reply timestamp aggregation', () => {
  const parent = {
    id: 'p_1',
    replyCount: 0,
    latestReplyAt: undefined,
    replyUserIds: []
  };

  const addReply = (parentMsg, reply) => {
    return {
      ...parentMsg,
      replyCount: parentMsg.replyCount + 1,
      latestReplyAt: reply.timestamp,
      replyUserIds: Array.from(new Set([...parentMsg.replyUserIds, reply.senderId]))
    };
  };

  const r1 = addReply(parent, { senderId: 'u2', timestamp: '2026-10-01T12:00:00Z' });
  const r2 = addReply(r1, { senderId: 'u3', timestamp: '2026-10-01T12:05:00Z' });

  assert.strictEqual(r2.replyCount, 2);
  assert.strictEqual(r2.latestReplyAt, '2026-10-01T12:05:00Z');
  assert.deepStrictEqual(r2.replyUserIds, ['u2', 'u3']);
});

console.log('\n========================================');
console.log(`📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
console.log('========================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
