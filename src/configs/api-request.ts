import { CoreOptions } from "@microfleet/core"

export const apiRequest: CoreOptions['apiRequest'] = {
  timeout: 30000,
  routes: {
    createQuestion: 'interactive.question.create',
    syncTweet: 'social.tweet.sync'
  },
  publishOptions: {
    createQuestion: {
      timeout: 5000,
    },
    syncTweet: {
      timeout: 5000,
    }
  }
}
