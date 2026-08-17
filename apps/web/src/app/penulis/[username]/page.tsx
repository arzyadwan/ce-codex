import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleArchive } from "@/app/_components/article-archive";
import { getPublicFacets } from "@/lib/public-api";
export async function generateMetadata({params}:{params:Promise<{username:string}>}):Promise<Metadata>{const username=(await params).username;const author=(await getPublicFacets()).authors.find((item)=>item.username===username);return author?{title:author.displayName,description:`Artikel yang ditulis oleh ${author.displayName} di Crypto Exist.`}:{title:"Penulis tidak ditemukan"};}
export default async function AuthorPage({params,searchParams}:{params:Promise<{username:string}>;searchParams:Promise<{page?:string}>}){const username=(await params).username;const author=(await getPublicFacets()).authors.find((item)=>item.username===username);if(!author)notFound();return <ArticleArchive title={author.displayName} description={`Kumpulan artikel oleh ${author.displayName}, kontributor Crypto Exist.`} filters={{author:username}} search={(await searchParams).page} basePath={`/penulis/${username}`}/>;}
