import { test } from '@japa/runner'
import cache from '@adonisjs/cache/services/main'
import { PackagesFetcher } from '#services/packages_fetcher'

import { FakePkgFetcher, packageFactory } from '../helpers.js'

test.group('Packages Fetcher', (group) => {
  group.teardown(() => cache.clear())

  test('returns categories with count', async ({ assert }) => {
    const result = await new PackagesFetcher(new FakePkgFetcher(), [
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Authentication' }),
      packageFactory({ category: 'Authentication' }),
    ]).fetchPackages()

    const authCategory = result.categories.find((category) => category.label === 'Authentication')
    const dbCategory = result.categories.find((category) => category.label === 'Database')

    assert.equal(authCategory?.count, 2)
    assert.equal(dbCategory?.count, 3)
  })

  test('add github stars to each packages', async ({ assert }) => {
    const result = await new PackagesFetcher(new FakePkgFetcher(), [
      packageFactory(),
      packageFactory(),
      packageFactory(),
    ]).fetchPackages()

    const stars = result.packages.map((pkg) => pkg.stars)
    const downloads = result.packages.map((pkg) => pkg.downloads)

    assert.isTrue(stars.every((star) => star >= 200))
    assert.isTrue(downloads.every((download) => download >= 20_000))
  })

  test('filter packages by category', async ({ assert }) => {
    const result = await new PackagesFetcher(new FakePkgFetcher(), [
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Database' }),
      packageFactory({ category: 'Authentication' }),
      packageFactory({ category: 'Authentication' }),
    ]).fetchPackages({ category: 'Database' })

    assert.equal(result.packages.length, 3)
  })

  test('sort packages by stars', async ({ assert }) => {
    const result = await new PackagesFetcher(new FakePkgFetcher(), [
      packageFactory(),
      packageFactory(),
      packageFactory(),
      packageFactory(),
      packageFactory(),
    ]).fetchPackages({ sort: 'stars' })

    const stars = result.packages.map((pkg) => pkg.stars)

    assert.deepEqual(
      stars,
      stars.sort((a, b) => b - a)
    )
  })

  test('return pagination meta', async ({ assert }) => {
    const fetcher = new PackagesFetcher(
      new FakePkgFetcher(),
      Array.from({ length: 50 }).map(() => packageFactory())
    )

    const result = await fetcher.fetchPackages({ page: 2 })

    assert.deepEqual(result.meta, { currentPage: 2, total: 50, pages: 6 })
  })

  test('search package by name', async ({ assert }) => {
    const fetcher = new PackagesFetcher(new FakePkgFetcher(), [
      packageFactory({ name: 'adonis-foo' }),
      packageFactory({ name: 'adonis-bar' }),
      packageFactory({ name: 'adonis-baz' }),
      packageFactory({ name: 'adonis-xyz' }),
    ])

    const result = await fetcher.fetchPackages({ search: 'adonis-b' })

    assert.equal(result.packages.length, 2)
  })
})
