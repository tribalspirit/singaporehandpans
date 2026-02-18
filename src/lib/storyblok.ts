import StoryblokClient from 'storyblok-js-client';

let client: StoryblokClient | null = null;

export function getStoryblokClient(): StoryblokClient {
  if (!client) {
    client = new StoryblokClient({
      accessToken: import.meta.env.STORYBLOK_TOKEN,
    });
  }
  return client;
}
