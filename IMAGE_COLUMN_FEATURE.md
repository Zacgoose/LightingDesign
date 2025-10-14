# CippDataTable Image Column Feature

## Overview

The `CippDataTable` component now supports rendering images from URLs in table columns through the new `imageColumn` prop.

## Usage

### Basic Usage - Single Column

To display images in a single column, pass the column name as a string:

```jsx
<CippDataTable
  title="Products"
  api={{ url: "api/ListProducts" }}
  imageColumn="productImageUrl"
  simpleColumns={["name", "productImageUrl", "price"]}
/>
```

### Advanced Usage - Multiple Columns

To display images in multiple columns, pass an array of column names:

```jsx
<CippDataTable
  title="Users"
  api={{ url: "api/ListUsers" }}
  imageColumn={["avatarUrl", "companyLogoUrl"]}
  simpleColumns={["name", "avatarUrl", "companyLogoUrl", "email"]}
/>
```

### Array of Images

If your data contains an array of image URLs, they will be rendered side by side:

```jsx
// Data structure:
// { name: "Product", images: ["url1.jpg", "url2.jpg", "url3.jpg"] }

<CippDataTable
  title="Products"
  data={products}
  imageColumn="images"
  simpleColumns={["name", "images", "price"]}
/>
```

## Image Rendering Details

- **Image Size**: Images are rendered at 40x40 pixels by default with `object-fit: contain`
- **Null/Empty Values**: If the URL is null, undefined, or empty, a "No data" chip is displayed
- **Arrays**: Multiple images are displayed horizontally with a small gap between them
- **Error Handling**: Invalid URLs will show the browser's default broken image icon

## Example Data Structures

### Single Image URL
```javascript
{
  name: "Product A",
  imageUrl: "https://example.com/image.jpg",
  price: "$99"
}
```

### Array of Image URLs
```javascript
{
  name: "Product B",
  imageUrls: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  price: "$149"
}
```

## Complete Example

```jsx
import { CippDataTable } from "../components/CippTable/CippDataTable";
import { Layout as DashboardLayout } from "../layouts/index.js";

const Page = () => {
  return (
    <Container maxWidth="xl">
      <CippDataTable
        title="Products with Images"
        api={{ url: "api/ListProducts" }}
        imageColumn="imageUrl"
        simpleColumns={["name", "imageUrl", "category", "price"]}
        actions={[
          {
            label: "View Details",
            type: "GET",
            url: "api/GetProductDetails",
            data: { id: "productId" }
          }
        ]}
      />
    </Container>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
```

## Notes

- The `imageColumn` prop works with both API-fetched data and static data
- Images are only rendered in the table view, not in exported data
- The feature integrates seamlessly with existing table features like sorting, filtering, and pagination
