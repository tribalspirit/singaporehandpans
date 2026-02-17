const STORYBLOK_MAPI_BASE = 'https://mapi.storyblok.com/v1';

function getManagementConfig() {
  const token = import.meta.env.STORYBLOK_MANAGEMENT_TOKEN;
  const spaceId = import.meta.env.STORYBLOK_SPACE_ID;

  if (!token || !spaceId) {
    throw new Error('Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID');
  }

  return { token, spaceId };
}

interface StoryblokStory {
  id: number;
  slug: string;
  name: string;
  content: Record<string, unknown>;
}

interface StoryblokStoriesResponse {
  stories: StoryblokStory[];
}

interface StoryblokStoryResponse {
  story: StoryblokStory;
}

export async function findEventByAcuityId(
  classId: string
): Promise<StoryblokStory | null> {
  const { token, spaceId } = getManagementConfig();

  const params = new URLSearchParams({
    starts_with: 'events/',
    content_type: 'event',
    'filter_query[acuity_class_id][in]': classId,
  });

  const response = await fetch(
    `${STORYBLOK_MAPI_BASE}/spaces/${spaceId}/stories?${params.toString()}`,
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Storyblok Management API error: ${response.status}`);
  }

  const data: StoryblokStoriesResponse = await response.json();
  return data.stories[0] || null;
}

export async function updateEventAvailability(
  storyId: number,
  updates: {
    availability_status: string;
    spots_remaining: number;
  }
): Promise<void> {
  const { token, spaceId } = getManagementConfig();

  // First, get the current story to merge content
  const getResponse = await fetch(
    `${STORYBLOK_MAPI_BASE}/spaces/${spaceId}/stories/${storyId}`,
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!getResponse.ok) {
    throw new Error(`Failed to fetch story ${storyId}: ${getResponse.status}`);
  }

  const { story }: StoryblokStoryResponse = await getResponse.json();

  // Merge updates into existing content
  const updatedContent = {
    ...story.content,
    availability_status: updates.availability_status,
    spots_remaining: updates.spots_remaining,
  };

  // PATCH + publish
  const putResponse = await fetch(
    `${STORYBLOK_MAPI_BASE}/spaces/${spaceId}/stories/${storyId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story: { content: updatedContent },
        publish: 1,
      }),
    }
  );

  if (!putResponse.ok) {
    throw new Error(`Failed to update story ${storyId}: ${putResponse.status}`);
  }
}
