import OpengraphImage from 'components/opengraph-image';
import { getPage } from 'lib/shopware';

export const runtime = 'edge';

export default async function Image({ params }: { params: { page: string } }) {
  const { page: pageParamName } = await params;
  const page = await getPage(pageParamName);
  const title = page ? page.seo?.title || page.title : '';

  return await OpengraphImage({ title });
}
