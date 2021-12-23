import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import { formatDate } from '../../utils/formatDate';

interface Post {
    first_publication_date: string | null;
    data: {
        title: string;
        banner: {
            url: string;
        };
        author: string;
        content: {
            heading: string;
            body: {
                text: string;
            }[];
        }[];
    };
}

interface PostProps {
    post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
    const router = useRouter();

    if (router.isFallback) {
        return <div>Carregando...</div>;
    }

    function getReadingTime(): number {
        const regexPattern = /[^\w]/;
        const totalWords = post.data.content.reduce((acc, item) => {
            const totalHeadingWords =
                item.heading?.split(regexPattern).length ?? 0;

            const totalBodyWords = item.body.reduce((bodyAcc, bodyItem) => {
                return bodyAcc + bodyItem.text.split(regexPattern).length;
            }, 0);

            return acc + totalHeadingWords + totalBodyWords;
        }, 0);

        return Math.round(totalWords / 200);
    }

    const formattedDate = formatDate(post.first_publication_date);

    return (
        <>
            <Header padding={40} />
            <div className={styles.bannerContainer} />
            <div className={styles.contentContainer}>
                <div className={styles.contentHeader}>
                    <h1>{post.data.title}</h1>
                    <div>
                        <span>
                            <FiCalendar size={18} />
                            {formattedDate}
                        </span>
                        <span>
                            <FiUser size={18} />
                            {post.data.author}
                        </span>
                        <span>
                            <FiClock size={18} />
                            {getReadingTime()} min
                        </span>
                    </div>
                </div>
                <div className={styles.contentBody}>
                    {post.data.content.map(item => (
                        <div key={(Math.random() * 9999999).toString()}>
                            <h2>{item.heading}</h2>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: RichText.asHtml(item.body),
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const prismic = getPrismicClient();
    const posts = await prismic.query([
        Prismic.Predicates.at('document.type', 'posts'),
    ]);

    const paths = posts.results.map(post => {
        return {
            params: {
                slug: post.uid,
            },
        };
    });

    return {
        paths,
        fallback: true,
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const { slug } = params;

    const prismic = getPrismicClient();
    const response = await prismic.getByUID('post', String(slug), {});

    const post = {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
            title: response.data.title,
            subtitle: response.data.subtitle,
            author: response.data.author,
            banner: {
                url: response.data.banner.url,
            },
            content: response.data.content.map(content => {
                return {
                    heading: content.heading,
                    body: [...content.body],
                };
            }),
        },
    };

    return {
        props: {
            post,
        },
    };
};
