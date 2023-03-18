# @dawiidio/rss 

Small library for quick rss endpoints development. It's just a
syntax sugar for a few standards: raw `RSS2`, `Apple podcast` and `Spotify podcast`.

Below mobile view generated from builtin `html` renderer

![Mobile view](https://github.com/dawiidio/rss/blob/main/static/mobile.png?raw=true)

### Installation

```shell
yarn add @dawiidio/rss
# or
npm install @dawiidio/rss
```

## Usage

Basic example

```typescript
import { createRssChannel, IChannelProps, createRendererForChannel, getRenderer } from '@dawiidio/rss'; 

const channel: IChannelProps = {
    title: 'My podcast',
    description: 'I will talk about unicorns and magic beasts',
    link: 'https://mypage.xyz/podcast',
    items: [
        {
            title: 'How I meet unicorn',
            description: 'Story about how I meet <strong>unicorn</strong> for the first time!',
            link: 'https://mypage.xyz/podcast/unicorn-story'
        },
    ]
};

const renderer = createRendererForChannel(getRenderer('xml'), channel);

console.log(renderer.render());
```

Basic podcast example (raw xml, see itunes below)

```typescript
import { 
    createRssChannel, 
    IChannelProps,
    createRendererForChannel,
    getRenderer,
    parseToRSSDateFormat,
    megabytesToBytes
} from '@dawiidio/rss';

const channel: IChannelProps = {
    title: 'My podcast',
    description: 'I will talk about unicorns and magic beasts',
    link: 'https://magicbeasts.xyz/podcast',
    language: 'en-US',
    image: {
        url: 'https://magicbeasts.xyz/public/podcast-cover.jpg',
        title: 'Podcast cover',
        link: 'https://magicbeasts.xyz/podcast'
    },
    items: [
        {
            title: 'How I meet unicorn',
            description: 'Story about how I meet <strong>unicorn</strong> for the first time!',
            link: 'https://magicbeasts.xyz/podcast/unicorn-story',
            author: {
                name: 'John Doe',
                email: 'john@magicbeasts.xyz'
            },
            enclosure: {
                url: 'https://magicbeasts.xyz/public/unicorn-story.mp3',
                type: 'audio/mp3',
                length: megabytesToBytes(86) // file size in bytes
            },
            pubDate: parseToRSSDateFormat('21.02.2023')
        },
    ]
};

const renderer = createRendererForChannel(getRenderer('xml'), channel);

console.log(renderer.render());
```

Since Spotify and Apple are using additional tags for podcasts you can specify them
in `overrides` field available on channel and item (episode) level.

```typescript
import { 
    createRssChannel,
    IChannelProps,
    createRendererForChannel,
    getRenderer,
    megabytesToBytes,
    parseHMSToSeconds
} from '@dawiidio/rss';

const channel: IChannelProps = {
    title: 'My podcast',
    description: 'I will talk about unicorns and magic beasts',
    link: 'https://magicbeasts.xyz/podcast',
    language: 'en-US',
    image: {
        url: 'https://magicbeasts.xyz/public/podcast-cover.jpg',
        title: 'Podcast cover',
        link: 'https://magicbeasts.xyz/podcast'
    },
    items: [
        {
            title: 'How I meet unicorn',
            description: 'Story about how I meet <strong>unicorn</strong> for the first time!',
            link: 'https://magicbeasts.xyz/podcast/unicorn-story',
            author: {
                name: 'John Doe',
                email: 'john@magicbeasts.xyz'
            },
            enclosure: {
                url: 'https://magicbeasts.xyz/public/unicorn-story.mp3',
                type: 'audio/mp3',
                length: megabytesToBytes(125.5) // file size in bytes
            },
            overrides: {
                itunes: {
                    image: 'https://magicbeasts.xyz/public/unicorn-story-cover.jpg',
                    duration: parseHMSToSeconds('1:23:05')
                }
            }
        },
    ],
    overrides: {
        itunes: {
            title: 'This is a specific title only for Apple Podcast'
        }
    }
};

const renderer = createRendererForChannel(getRenderer('xml:itunes'), channel);

console.log(renderer.render());
```

## Ui renderer
HTML renderer is also included by default in library, there are two methods to render html for rss,

first, simple with default settings
```typescript
import { HtmlRss2Renderer, createRssChannel, IChannelProps, createRendererForChannel, getRenderer } from '@dawiidio/rss';
import css from '@dawiidio/rss/lib/styles.css'; // contains styles for default html renderer, should be added to bundle 

const renderer = createRendererForChannel(
    getRenderer('html'),
    channel
);
```

second, with options 
```typescript
import { HtmlRss2Renderer, createRssChannel, IChannelProps, createRendererForChannel, getRenderer } from '@dawiidio/rss';

const renderer = createRendererForChannel(
    new HtmlRss2Renderer({ cssClassPrefix: 'my prefix' }),
    channel
);
```

`UiRenderer` also has different api than base renderer

```typescript
import { HtmlRss2Renderer, createRssChannel, IChannelProps, createRendererForChannel, getRenderer } from '@dawiidio/rss';

const renderer = createRendererForChannel(
    new HtmlRss2Renderer({ 
        cssClassPrefix: 'my-prefix-',
        trimEpisodeDescInListTo: 200
    }),
    channel
);

console.log(renderer.renderEpisodePage('episode guid')); // renders html for single item/episode
console.log(renderer.renderChannelPage({
    getPaginationUrl: (page, active) => `https://dawiid.io/podcast/${page}`,
    itemsPerPage: 20,
    offset: 0,
    activeItem: 0,
})); // renders page with list of items/episodes and pagination
```

### Default HTML renderer views

Default html renderer contains below views

#### Episodes list
![Episodes list](https://github.com/dawiidio/rss/blob/main/static/list.png?raw=true)

#### Single episode view
![Episode preview](https://github.com/dawiidio/rss/blob/main/static/episode.png?raw=true)

All views are responsive.


## Custom renderers
You can add your own renderers by extending after `Renderer` class or `UiRenderer`.

Differences between `Renderer` and `UiRenderer`:
- `Renderer` is for formats not needing visual representation (like `xml` or `json`) because they are read by machines 
- `UiRenderer` is for visual representation formats like `html`

For sample implementations look in `src/renderer/xml` and `src/renderer/html` folders

```typescript
import { createRssChannel, Renderer } from '@dawiidio/rss';

class MyRenderer extends Renderer {
    // ...
}

const renderer = createRendererForChannel(new MyRenderer(), channel);

console.log(renderer.render());
```

### Sources
- [Apple podcaster's guide to RSS](https://help.apple.com/itc/podcasts_connect/#/itcb54353390)
- [Raw RSS2 standard](https://validator.w3.org/feed/docs/rss2.html)
- [Spotify's resources for podcasters](https://support.spotifyforpodcasters.com/hc/en-us)
- [Apple's support post about podcast rss](https://podcasters.apple.com/support/823-podcast-requirements)
