import Link from 'next/link';
import styles from './header.module.scss';

interface HeaderProps {
    padding: number;
}

export default function Header({ padding }: HeaderProps): JSX.Element {
    return (
        <div
            className={styles.container}
            style={{ paddingTop: padding, paddingBottom: padding }}
        >
            <div>
                <Link href="/">
                    <a>
                        <img src="/images/logo.svg" alt="logo" />
                    </a>
                </Link>
            </div>
        </div>
    );
}
