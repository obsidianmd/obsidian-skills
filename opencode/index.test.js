import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { test } from "node:test"
import plugin from "./index.js"

test("registers the bundled skills without replacing an existing skill", async () => {
  const existing = { id: "obsidian-cli" }
  const skills = new Map([[existing.id, existing]])
  await plugin.setup({
    skill: {
      transform: (register) => register({
        get: (id) => skills.get(id),
        add: (skill) => skills.set(skill.id, skill),
      }),
    },
  })

  assert.deepEqual([...skills.keys()].sort(), [
    "defuddle", "json-canvas", "knap", "obsidian-bases", "obsidian-cli", "obsidian-headless", "obsidian-markdown",
  ])
  assert.equal(skills.get(existing.id), existing)
  const markdown = skills.get("obsidian-markdown")
  assert.equal(markdown.name, "obsidian-markdown")
  assert.match(markdown.description, /Obsidian Flavored Markdown/)
  assert.match(markdown.content, /^# Obsidian Flavored Markdown Skill\b/)
  const reference = await readFile(join(dirname(markdown.path), "references", "PROPERTIES.md"), "utf8")
  assert.match(reference, /properties/i)
})
