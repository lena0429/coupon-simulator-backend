import { describe, it, expect } from 'vitest';
import { skillRegistry, getSkill, listSkills } from '../registry';

const EXPECTED_SKILL_NAMES = [
  'get_cart',
  'validate_coupon',
  'apply_coupon',
  'simulate_checkout',
];

describe('skillRegistry', () => {
  it('contains exactly 4 skills', () => {
    expect(skillRegistry).toHaveLength(4);
  });

  it('includes all expected skill names', () => {
    const names = skillRegistry.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(EXPECTED_SKILL_NAMES));
  });

  it('every skill has a non-empty name', () => {
    skillRegistry.forEach((skill) => {
      expect(skill.name).toBeTruthy();
    });
  });

  it('every skill has a non-empty description', () => {
    skillRegistry.forEach((skill) => {
      expect(skill.description).toBeTruthy();
    });
  });

  it('every skill has a callable handler', () => {
    skillRegistry.forEach((skill) => {
      expect(typeof skill.handler).toBe('function');
    });
  });

  it('every skill has an inputSchema with a safeParse method', () => {
    skillRegistry.forEach((skill) => {
      expect(typeof skill.inputSchema.safeParse).toBe('function');
    });
  });

  it('skill names are unique', () => {
    const names = skillRegistry.map((s) => s.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('getSkill', () => {
  it.each(EXPECTED_SKILL_NAMES)('finds skill "%s" by name', (name) => {
    const skill = getSkill(name);
    expect(skill).toBeDefined();
    expect(skill?.name).toBe(name);
  });

  it('returns undefined for an unknown skill name', () => {
    expect(getSkill('does_not_exist')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getSkill('')).toBeUndefined();
  });
});

describe('listSkills', () => {
  it('returns 4 entries', () => {
    expect(listSkills()).toHaveLength(4);
  });

  it('each entry has a name and description', () => {
    listSkills().forEach((entry) => {
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
    });
  });

  it('names match the registry', () => {
    const listed = listSkills().map((e) => e.name);
    const registered = skillRegistry.map((s) => s.name);
    expect(listed).toEqual(registered);
  });

  it('does not expose handler or inputSchema', () => {
    listSkills().forEach((entry) => {
      expect(entry).not.toHaveProperty('handler');
      expect(entry).not.toHaveProperty('inputSchema');
    });
  });
});
