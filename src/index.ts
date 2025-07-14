import { FastMCP, UserError } from 'fastmcp';
import { z } from 'zod';
import 'dotenv/config';

const server = new FastMCP({
  name: 'Eventfinda Server',
  version: '1.0.0',
});

const eventfindaUsername = process.env.EVENTFINDA_USERNAME;
const eventfindaPassword = process.env.EVENTFINDA_PASSWORD;

if (!eventfindaUsername || !eventfindaPassword) {
  throw new Error(
    'Eventfinda username or password not set in environment variables.'
  );
}

const auth =
  'Basic ' +
  Buffer.from(eventfindaUsername + ':' + eventfindaPassword).toString('base64');

async function fetchFromEventfinda(
  endpoint: string,
  params: Record<string, string>
) {
  const url = new URL(`https://api.eventfinda.co.nz/v2/${endpoint}.json`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: auth,
    },
  });

  if (!response.ok) {
    throw new UserError(
      `Failed to fetch from Eventfinda API: ${response.statusText}`
    );
  }

  return await response.json();
}

// Function to fetch and extract description from event webpage
async function fetchEventDescription(
  eventUrl: string,
  log: any
): Promise<string | null> {
  try {
    const response = await fetch(eventUrl);
    if (!response.ok) {
      log.error(`Failed to fetch event page: ${response.statusText}`);
      return null;
    }

    const html = await response.text();

    // Simple HTML parsing to find element with id 'eventDescription'
    const descriptionMatch = html.match(
      /<div[^>]*id=['"]eventDescription['"][^>]*>([\s\S]*?)<\/div>/i
    );
    if (descriptionMatch && descriptionMatch[1]) {
      // Clean up HTML tags and decode HTML entities
      return descriptionMatch[1]
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace ampersands
        .replace(/&lt;/g, '<') // Replace less than
        .replace(/&gt;/g, '>') // Replace greater than
        .replace(/&quot;/g, '"') // Replace quotes
        .trim();
    }
    return null;
  } catch (error) {
    log.error(`Error fetching event description from URL: ${error}`);
    return null;
  }
}

server.addTool({
  name: 'list_events',
  description: 'List all events within this week for a given location.',
  parameters: z.object({
    location: z.string().describe('The location to search for events in.')
  }),
  execute: async (args, { log }) => {
    const today = new Date();
    const nextWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7
    );

    // Step 1: Find location ID from location name
    const locations = await fetchFromEventfinda('locations', {
      q: args.location,
    });
    if (!locations.locations.length) {
      throw new UserError(`Could not find location: ${args.location}`);
    }
    const locationId = locations.locations[0].id;

    // Step 2: Get events by location and date range
    const eventsResponse = await fetchFromEventfinda('events', {
      location: locationId,
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      rows: '10', // Limit to 10 events to avoid rate limiting
    });

    log.debug(`Found ${eventsResponse.events.length} events`);

    // Step 3: Get detailed information for each event
    const eventDetails = await Promise.all(
      eventsResponse.events.map(async (event: any) => {
        try {
          // Get detailed event information using event ID
          return await fetchFromEventfinda(`events/${event.id}.json`, {});
        } catch (error) {
          log.error(`Error fetching details for event ${event.id}:`, error);
          // Return basic event info if detailed fetch fails
          return event;
        }
      })
    );

    // Step 4: Process each event to extract required information
    const processedEvents = await Promise.all(
      eventDetails.map(async (eventDetail: any) => {
        // Extract event from the response structure
        const event = eventDetail.event || eventDetail;

        // Extract and process description from API
        let description = 'No description available';
        if (event.description) {
          if (typeof event.description === 'string') {
            description = event.description;
          } else if (event.description.html) {
            description = event.description.html.replace(/<[^>]*>?/gm, '');
          }
        }

        // If we have a URL, try to fetch completed description from HTML
        if (event.url) {
          log.debug(
            `Fetching description from event page for event ${event.id}`
          );
          const htmlDescription = await fetchEventDescription(event.url, log);
          if (htmlDescription && htmlDescription.length > 0) {
            description = htmlDescription;
            log.debug(
              `Successfully extracted description from HTML for event ${event.id}`
            );
          }
        }

        // Check if event is free
        const isFree = Boolean(event.is_free);
        let ticketInfo = 'No ticket information available';

        // Process ticket information
        if (
          event.ticket_types &&
          Array.isArray(event.ticket_types.ticket_types) &&
          event.ticket_types.ticket_types.length > 0
        ) {
          ticketInfo = event.ticket_types.ticket_types.map((ticket: any) => ({
            name: ticket.name || 'Unnamed ticket',
            price: ticket.price,
            description: ticket.description,
            onsale_at: ticket.onsale_at,
          }));
        }

        return {
          id: event.id,
          title: event.name,
          description: description,
          url: event.url,
          datetime_start: event.datetime_start || event.datetime_summary,
          datetime_end: event.datetime_end || event.datetime_summary,
          address: event.address,
          is_free: isFree,
          ticket_info: isFree ? 'Free event' : ticketInfo,
          categories: event.category.name,
        };
      })
    );

    return JSON.stringify(processedEvents, null, 2);
  },
});

await server.start({
  transportType: 'stdio',
});
