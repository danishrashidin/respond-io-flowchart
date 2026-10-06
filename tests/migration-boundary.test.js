// @vitest-environment node
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc'

const root = fileURLToPath(new URL('../', import.meta.url))
function walk(directory, read = (file) => fs.readFileSync(file, 'utf8')) {
  return fs.readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name)
    const stat = fs.lstatSync(file)
    if (stat.isSymbolicLink()) return []
    if (stat.isDirectory()) return walk(file, read)
    return [{ file, content: read(file) }]
  })
}

describe('migration boundary', () => {
  it('repository source has no TypeScript and every SFC compiles', () => {
    const source = walk(path.join(root, 'src'))
    const typedScripts = [],
      compilationErrors = [],
      typedImports = []
    expect(source.filter(({ file }) => /\.tsx?$/.test(file)).map(({ file }) => file)).toEqual([])
    for (const { file, content } of source) {
      if (/\b(?:from\s*|import\s*\(?\s*)['"][^'"]+\.tsx?['"]/.test(content)) typedImports.push(file)
      if (!file.endsWith('.vue')) continue
      const { descriptor, errors } = parse(content, { filename: file })
      compilationErrors.push(...errors.map((error) => `${file}: ${error}`))
      if (
        [descriptor.script, descriptor.scriptSetup].some((block) => /^(ts|tsx)$/.test(block?.lang))
      )
        typedScripts.push(file)
      let bindings
      try {
        if (descriptor.script || descriptor.scriptSetup)
          bindings = compileScript(descriptor, { id: file }).bindings
        if (descriptor.template) {
          const result = compileTemplate({
            source: descriptor.template.content,
            filename: file,
            id: file,
            compilerOptions: { bindingMetadata: bindings },
          })
          compilationErrors.push(...result.errors.map((error) => `${file}: ${error}`))
        }
      } catch (error) {
        compilationErrors.push(`${file}: ${error.message}`)
      }
    }
    expect(typedScripts).toEqual([])
    expect(typedImports).toEqual([])
    expect(compilationErrors).toEqual([])
  })

  it('authored tooling is JavaScript and old typechecking is absent', () => {
    const oldFiles = [
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'env.d.ts',
    ]
    expect(oldFiles.filter((file) => fs.existsSync(path.join(root, file)))).toEqual([])
    const { scripts, devDependencies } = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    )
    expect(scripts.build).toBe('vite build')
    expect(scripts['type-check']).toBeUndefined()
    for (const name of [
      'typescript',
      'vue-tsc',
      '@vue/tsconfig',
      '@tsconfig/node24',
      '@types/node',
      'npm-run-all2',
    ])
      expect(devDependencies[name]).toBeUndefined()
    expect(JSON.parse(fs.readFileSync(path.join(root, 'components.json'), 'utf8')).typescript).toBe(
      false,
    )
    expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toContain('src="/src/main.js"')
  })

  it('source walker does not follow dependency symlinks', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-boundary-'))
    try {
      const source = path.join(fixture, 'src'),
        dependency = path.join(fixture, 'dependency')
      fs.mkdirSync(source)
      fs.mkdirSync(dependency)
      const repositoryFile = path.join(source, 'owned.js'),
        sentinel = path.join(dependency, 'sentinel.ts')
      fs.writeFileSync(repositoryFile, 'export const owned = true')
      fs.writeFileSync(sentinel, 'type Dependency = string')
      fs.symlinkSync(dependency, path.join(source, 'dependency'), 'dir')
      let dependencyReads = 0
      const files = walk(source, (file) => {
        if (file.startsWith(dependency + path.sep)) dependencyReads++
        return fs.readFileSync(file, 'utf8')
      })
      expect(files.map(({ file }) => file)).toEqual([repositoryFile])
      expect(dependencyReads).toBe(0)
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true })
    }
  })
})
