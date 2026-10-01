import Fuse from 'fuse.js'
import type { SearchPost, SearchWorkerMessage, SearchWorkerResponse } from '../scripts/search'

let fuse: Fuse<SearchPost> | null = null

self.onmessage = (event: MessageEvent<SearchWorkerMessage>): void => {
  try {
    let response: SearchWorkerResponse
    if (event.data.type === 'INIT') {
      fuse = new Fuse(event.data.payload.posts, event.data.payload.options)
      response = { type: 'INITIALIZED' }
    } else {
      if (!fuse) throw new Error('Fuse not initialized')
      const { query, requestId } = event.data.payload
      response = { type: 'SEARCH_RESULTS', payload: fuse.search(query, { limit: 5 }), requestId }
    }
    self.postMessage(response)
  } catch (error) {
    self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : String(error) })
  }
}
