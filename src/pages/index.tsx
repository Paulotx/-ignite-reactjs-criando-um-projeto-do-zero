import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import styles from './home.module.scss';
import { formatDate } from '../utils/formatDate';

interface Post {
    uid: string;
    first_publication_date: string | null;
    data: {
        title: string;
        subtitle: string;
        author: string;
    };
}

interface PostPagination {
    next_page: string;
    results: Post[];
}

interface HomeProps {
    postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
    const formattedPost = postsPagination.results.map(post => {
        return {
            ...post,
            first_publication_date: formatDate(post.first_publication_date),
        };
    });

    const [posts, setPosts] = useState<Post[]>(formattedPost);
    const [nextPage, setNextPage] = useState(postsPagination.next_page);

    async function loadMorePosts(): Promise<void> {
        const postsResponse = await fetch(nextPage)
            .then(response => response.json())
            .catch(err => {
                console.log(err);
            });

        setNextPage(postsResponse.next_page);

        const results = postsResponse.results.map(post => {
            return {
                uid: post.uid,
                first_publication_date: formatDate(post.first_publication_date),
                data: {
                    title: post.data.title,
                    subtitle: post.data.subtitle,
                    author: post.data.author,
                },
            };
        });

        setPosts([...posts, ...results]);
    }

    return (
        <>
            <Header padding={80} />

            <div className={styles.container}>
                <div className={styles.posts}>
                    {posts.map(post => (
                        <Link href={`/post/${post.uid}`} key={post.uid}>
                            <a>
                                <strong>{post.data.title}</strong>
                                <p>{post.data.subtitle}</p>
                                <div>
                                    <span>
                                        <FiCalendar size={16} />
                                        <time>
                                            {post.first_publication_date}
                                        </time>
                                    </span>
                                    <span>
                                        <FiUser size={18} />
                                        {post.data.author}
                                    </span>
                                </div>
                            </a>
                        </Link>
                    ))}
                </div>

                {!!nextPage && (
                    <div className={styles.load_more_posts}>
                        <button type="button" onClick={loadMorePosts}>
                            Carregar mais posts
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async () => {
    const prismic = getPrismicClient();

    const postsResponse = await prismic.query(
        [Prismic.predicates.at('document.type', 'post')],
        {
            fetch: ['post.title', 'post.subtitle', 'post.author'],
            pageSize: 4,
        }
    );

    const results = postsResponse.results.map(post => {
        return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
            },
        };
    });

    const postsPagination = {
        next_page: postsResponse.next_page,
        results,
    };

    return {
        props: {
            postsPagination,
        },
        revalidate: 60 * 60 * 24 * 1,
    };
};
