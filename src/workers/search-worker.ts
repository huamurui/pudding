import Fuse, { type FuseResult, type IFuseOptions } from 'fuse.js'

interface Post {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  url: string;
}

interface InitMessage {
  type: 'INIT';
  payload: {
    posts: Post[];
    options: IFuseOptions<Post>;
  };
}

interface SearchMessage {
  type: 'SEARCH';
  payload: {
    query: string;
  };
}

interface InitializedMessage {
  type: 'INITIALIZED';
}

interface SearchResultsMessage {
  type: 'SEARCH_RESULTS';
  payload: FuseResult<Post>[];
}

interface ErrorMessage {
  type: 'ERROR';
  payload: string;
}

type WorkerMessage = InitMessage | SearchMessage;
type _WorkerResponse = InitializedMessage | SearchResultsMessage | ErrorMessage;

let fuse: Fuse<Post>

self.onmessage = (e: MessageEvent<WorkerMessage>): void => {
  const { type, payload } = e.data

  switch (type) {
    case 'INIT': {
      const { posts, options } = payload
      fuse = new Fuse(posts, options)
      self.postMessage<InitializedMessage>({ type: 'INITIALIZED' })
      break
    }

    case 'SEARCH': {
      const { query } = payload
      if (!fuse) {
        self.postMessage<ErrorMessage>({ type: 'ERROR', payload: 'Fuse not initialized' })
        return
      }
      const results = fuse.search(query)
      self.postMessage<SearchResultsMessage>({ type: 'SEARCH_RESULTS', payload: results })
      break
    }

    default: {
      self.postMessage<ErrorMessage>({ type: 'ERROR', payload: `Unknown message type: ${type}` })
    }
  }
}
