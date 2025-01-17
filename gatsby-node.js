/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require("path")
const _ = require("lodash");
const { paginate } = require('gatsby-awesome-pagination');


exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  const blogPostTemplate = path.resolve(`src/templates/blog-post.js`)
  const blogIndexTemplate = path.resolve(`src/templates/blog-index.js`);
  const tagTemplate = path.resolve(`src/templates/tags.js`)

  return graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        filter: { frontmatter: { published: { ne: false } } }
        limit: 2000
      ) {
        edges {
          node {
            frontmatter {
              path
              tags
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    const posts = result.data.allMarkdownRemark.edges;

    posts.forEach(({ node }) => {

      if (!node.frontmatter || !node.frontmatter.path) {
        console.warn('no frontmatter');
        return;
      }

      createPage({
        path: node.frontmatter.path,
        component: blogPostTemplate,
        context: {}, // additional data can be passed via context
      })
    })

    // Tag pages:
    let tags = [];

    // Iterate through each post, putting all found tags into `tags`
    _.each(posts, edge => {
      if (_.get(edge, "node.frontmatter.tags")) {
        tags = tags.concat(edge.node.frontmatter.tags)
      }
    });

    // Eliminate duplicate tags
    tags = _.uniq(tags)

    // Make tag pages
    tags.forEach(tag => {
      createPage({
        path: `/tags/${_.kebabCase(tag)}`,
        component: tagTemplate,
        context: {
          tag,
        },
      })
    })

    paginate({
      createPage, // The Gatsby `createPage` function
      items: posts, // An array of objects
      itemsPerPage: 20, // How many items you want per page
      pathPrefix: '/articles', // Creates pages like `/blog`, `/blog/2`, etc
      component: blogIndexTemplate, // Just like `createPage()`
    });
  })
}