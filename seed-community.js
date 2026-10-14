const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tagDefs = [
  "Technical SEO","Content","Link Building","Local SEO","Core Web Vitals","Analytics","On-Page","Off-Page","AI SEO","Enterprise"
];

const titles = [
  "Why your internal links are silently killing rankings",
  "I audited 200 sites. Here's what Google actually penalizes",
  "JavaScript SEO in 2025: what changed",
  "Case study: 40% traffic drop after migration",
  "Schema markup mistakes I see every week",
  "How I recovered from a Helpful Content update",
  "Best crawl budget strategy for large sites",
  "Local SEO checklist that actually works",
  "Content pruning: when to delete vs update",
  "EEAT in practice: what editors get wrong",
  "Log file analysis for beginners",
  "Image SEO: file names still matter?",
  "Canonical chains explained simply",
  "Open question: Hreflang or not?",
  "Resource: free SEO tools I use daily",
  "Discussion: Are AI overviews killing traffic?",
  "Case study: 3x organic in 6 months",
  "Question: how to handle expired product pages?",
  "Technical deep dive into Core Web Vitals",
  "Content strategy for SaaS in 2025"
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

async function main() {
  // Tags
  const tags = [];
  for (const name of tagDefs) {
    const slug = name.toLowerCase().replace(/\s+/g,"-");
    const color = `hsl(${rand(0,360)},70%,60%)`;
    tags.push(await prisma.tag.upsert({ where:{slug}, update:{}, create:{name,slug,color} }));
  }

  // Users
  const users = [];
  for (let i=0;i<20;i++){
    const username = `seo_${i}` ;
    const user = await prisma.user.upsert({
      where:{ clerkId:`seed_clerk_${i}` },
      update:{ reputation: rand(0,5000) },
      create:{
        clerkId:`seed_clerk_${i}`,
        username,
        email:`${username}@example.com`,
        name:`SEO User ${i}`,
        avatarUrl:`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: rand(0,1) ? "SEO professional sharing experiments." : null,
        website: rand(0,1) ? "https://example.com" : null,
        reputation: rand(0,5000),
      }
    });
    users.push(user);
  }

  // Posts
  const posts = [];
  for (let i=0;i<50;i++){
    const titleBase = titles[i % titles.length];
    const title = titleBase + (i>titles.length ? ` #${i}` : "");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + `-${i}`;
    const author = pick(users);
    const typePick = pick(["QUESTION","DISCUSSION","CASE_STUDY","RESOURCE"]);
    const tagSubset = [pick(tags), pick(tags)].filter((v,ix,arr)=>arr.indexOf(v)===ix);
    const score = rand(-5,80);
    const daysAgo = Math.random()*14;
    const createdAt = new Date(Date.now() - daysAgo*24*60*60*1000);
    const post = await prisma.post.upsert({
      where:{slug},
      update:{},
      create:{
        title,
        slug,
        type: typePick,
        content: `# ${title}\n\nHere is some **markdown** content about SEO topics.\n\n- Insight one\n- Insight two\n\nFeel free to comment.`,
        excerpt: (`# ${title}\n\nHere is some **markdown** content about SEO topics.\n\n- Insight one\n- Insight two\n\nFeel free to comment.`).slice(0,100).replace(/\n/g," "),
        published:true,
        authorId: author.id,
        tags:{connect: tagSubset.map(t=>({id:t.id}))},
        coverImage: Math.random()<0.3 ? `https://picsum.photos/seed/${slug}/800/450` : null,
        deletedAt:null,
        createdAt,
        updatedAt:createdAt,
      }
    });
    posts.push(post);

    // Votes approximating score
    let remaining = Math.abs(score);
    let val = score>=0 ? 1 : -1;
    for (let v=0; v< Math.min(remaining, 6); v++){
      const voter = pick(users);
      if (voter.id === author.id) continue;
      try {
        await prisma.vote.create({ data:{ userId:voter.id, postId:post.id, value: val, createdAt:new Date(createdAt.getTime()+v*1000*60) } });
      } catch {}
    }

    // Comments
    const commentCount = rand(0,8);
    const comments=[];
    for (let c=0;c<commentCount;c++){
      const ca = pick(users);
      const cm = await prisma.comment.create({
        data:{
          content: pick(["Great insights!","Thanks for sharing.","This matches my experience.","Question: how did you measure this?","Nice write-up.","Can you share more data?"]),
          authorId: ca.id,
          postId: post.id,
          parentId: null,
          createdAt: new Date(createdAt.getTime() + (c+1)*1000*60*60),
          updatedAt: new Date(createdAt.getTime() + (c+1)*1000*60*60),
        }
      });
      comments.push(cm);
      if (Math.random()<0.4 && comments.length>1){
        const replyAuthor = pick(users);
        await prisma.comment.create({
          data:{
            content: pick(["I agree.","Good point.","+1","Thanks for clarifying."]),
            authorId: replyAuthor.id,
            postId: post.id,
            parentId: cm.id,
            createdAt: new Date(cm.createdAt.getTime()+1000*60*30),
            updatedAt: new Date(cm.createdAt.getTime()+1000*60*30),
          }
        });
      }
    }

    if (typePick === "QUESTION" && comments.length){
      await prisma.comment.update({ where:{id:comments[0].id}, data:{ isAccepted:true } });
    }
  }

  // Follows
  for (let i=0;i<30;i++){
    const a = pick(users), b = pick(users);
    if (a.id===b.id) continue;
    try { await prisma.follow.create({ data:{ followerId:a.id, followingId:b.id } }); } catch {}
  }

  // Bookmarks
  for (let i=0;i<40;i++){
    const u = pick(users), p = pick(posts);
    try { await prisma.bookmark.create({ data:{ userId:u.id, postId:p.id } }); } catch {}
  }

  // Notifications
  for (const p of posts.slice(0,10)){
    await prisma.notification.create({
      data:{
        userId: p.authorId,
        type: "COMMENT_ON_POST",
        referenceId: p.id,
        title: "New comment on your post",
        body: "Great post!",
        read: Math.random()<0.5,
      }
    });
  }

  console.log("Seeded rich community data.");
}

main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e); process.exit(1)});