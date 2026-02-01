import { siteConfig } from '@/config/site.config'
import type { PostEntry, StructuredData } from '@/types'
import { getPostUrl } from './helpers'


export function generatePostStructuredData(
  post: PostEntry,
  description: string,
  origin: string
): StructuredData {
  const postUrl = new URL(getPostUrl(post.id), origin).toString()

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    headline: post.data.title,
    description: post.data.description || description,
    image: post.data.image?.url || '',
    author: {
      '@type': 'Person',
      name: post.data.author || siteConfig.author.name
    },
    datePublished: post.data.date,
    dateModified: post.data.updated || post.data.date,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.svg`
      }
    },
    url: postUrl,
    articleSection: post.data.tags?.[0] || '',
    keywords: post.data.tags?.join(', ') || ''
  }
}

export function generateWebsiteStructuredData(origin: string): StructuredData {
  return {
    '@type': 'WebSite',
    url: origin,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.svg`
      }
    }
  }
}

export function generatePostListStructuredData(
  posts: Array<{ title: string; url: string }>,
  origin: string
): StructuredData {
  const itemList = {
    '@type': 'ItemList',
    name: 'Recent posts',
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: new URL(p.url, origin).toString(),
      name: p.title
    }))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        url: origin,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/favicon.svg`
          }
        }
      },
      {
        '@type': 'CollectionPage',
        name: 'Recent posts',
        url: origin,
        description: siteConfig.description,
        mainEntity: itemList,
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/favicon.svg`
          }
        }
      }
    ]
  }
}
