import { readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { Plugin, Skill } from "@opencode/plugin"
import { parse } from "yaml"

const root = new URL("../plugins/obsidian/skills/", import.meta.url)

export default Plugin.define({
  id: "obsidian-skills",
  async setup(ctx) {
    const entries = await readdir(root, { withFileTypes: true })
    const skills = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async ({ name: id }) => {
      const path = fileURLToPath(new URL(`${id}/SKILL.md`, root))
      const source = await readFile(path, "utf8")
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
      const metadata = frontmatter && parse(frontmatter[1])
      if (typeof metadata?.name !== "string" || !metadata.name.trim() ||
          typeof metadata.description !== "string" || !metadata.description.trim()) {
        throw new Error(`Expected a name and description in ${path}`)
      }
      return {
        id: Skill.ID.make(id),
        name: Skill.Name.make(metadata.name),
        description: metadata.description,
        path: Skill.Info.fields.path.make(path),
        content: source.slice(frontmatter[0].length).trim(),
      }
    }))

    await ctx.skill.transform((editor) => {
      for (const skill of skills) {
        if (!editor.get(skill.id)) editor.add(skill)
      }
    })
  },
})
