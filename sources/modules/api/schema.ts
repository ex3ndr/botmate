import * as z from 'zod';
import { contentCodec } from './content';

//
// Feed
//

const updateFeedPost = z.object({
    type: z.literal('feed-posted'),
    source: z.string(),
    by: z.string(),
    date: z.number(),
    repeatKey: z.string().nullable(),
    seq: z.number(),
    content: contentCodec
})

//
// Memory
//

const memoryContent = z.object({
    title: z.string(),
    summary: z.string(),
    image: z.object({
        url: z.string(),
        thumbhash: z.string(),
        width: z.number(),
        height: z.number()
    }).nullable().optional()
});
export type MemoryContent = z.infer<typeof memoryContent>;

const memory = z.intersection(memoryContent, z.object({
    id: z.string(),
    index: z.number(),
    createdAt: z.number()
}));
export type Memory = z.infer<typeof memory>;

const updateMemoryCreated = z.object({
    type: z.literal('memory-created'),
    id: z.string(),
    index: z.number(),
    memory: memoryContent
});
const updateMemoryUpdated = z.object({
    type: z.literal('memory-updated'),
    id: z.string(),
    index: z.number(),
    memory: memoryContent
});
export const Updates = z.union([updateMemoryCreated, updateMemoryUpdated, updateFeedPost]);
export type UpdateMemoryCreated = z.infer<typeof updateMemoryCreated>;
export type UpdateMemoryUpdated = z.infer<typeof updateMemoryUpdated>;
export type UpdateFeedPosted = z.infer<typeof updateFeedPost>;
export type Update = UpdateMemoryCreated | UpdateMemoryUpdated | UpdateFeedPosted;
export type UpdateFeed = UpdateFeedPosted;

export const sseUpdate = z.object({
    seq: z.number(),
    data: z.any().optional()
});

export const Schema = {
    preState: z.object({
        needName: z.boolean(),
        needUsername: z.boolean(),
        active: z.boolean(),
        canActivate: z.boolean(),
    }),
    preUsername: z.union([z.object({
        ok: z.literal(true),
    }), z.object({
        ok: z.literal(false),
        error: z.union([z.literal('invalid_username'), z.literal('already_used')]),
    })]),
    preName: z.union([z.object({
        ok: z.literal(true),
    }), z.object({
        ok: z.literal(false),
        error: z.literal('invalid_name'),
    })]),
    getSeq: z.object({
        seq: z.number()
    }),
    getDiff: z.object({
        seq: z.number(),
        hasMore: z.boolean(),
        updates: z.array(z.any())
    }),
    accountStatus: z.object({
        ok: z.boolean()
    }),
    me: z.object({
        ok: z.literal(true),
        profile: z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            username: z.string(),
            email: z.string().nullable(),
            phone: z.string().nullable(),
            roles: z.array(z.string())
        })
    }),
    users: z.object({
        ok: z.literal(true),
        users: z.array(z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            username: z.string(),
            bot: z.boolean(),
            system: z.boolean(),
        }))
    }),
    feedState: z.object({
        ok: z.literal(true),
        seqno: z.number(),
    }),
    feedList: z.object({
        ok: z.literal(true),
        items: z.array(z.object({
            seq: z.number(),
            content: z.any(),
            date: z.number(),
            by: z.string(),
        })),
        next: z.number().nullable()
    }),
    ok: z.object({
        ok: z.literal(true)
    }),
    tokens: z.object({
        ok: z.literal(true),
        tokens: z.array(z.object({
            id: z.string(),
            created: z.number(),
            used: z.number().nullable()
        }))
    }),
    tokenCreate: z.object({
        ok: z.literal(true),
        token: z.object({
            id: z.string(),
            token: z.string()
        })
    }),
};