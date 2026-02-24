import PostPage from "../post/[slug]/page";

type Props = {
  params: { slug: string };
};

export default async function LegacyPostRoute(props: Props) {
  // Reuse the post renderer for legacy URLs like /explore/:slug
  return <PostPage params={props.params} />;
}
