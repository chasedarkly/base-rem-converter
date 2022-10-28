import fs from "fs";
import postcss, { AcceptedPlugin, Plugin } from "postcss";
import glob from "glob";

const transformPlugin: Plugin = {
  postcssPlugin: "Transform Plugin",
  Declaration(decl) {
    decl.value = decl.value.replace(
      /([+-]?([0-9]*[.])?[0-9]+)rem/g,
      (match, p1) => {
        // adding `r__em` is a silly hack to avoid this getting rematched infinitely.
        // doing a folderwide find and replace on `r__em` is easy.
        const newValue = `${(+p1 * 10) / 16}r__em`;
        console.log(`Converting ${match} to ${newValue}`);
        return newValue;
      }
    );
  },
};

const plugins: AcceptedPlugin[] = [transformPlugin];
const processor = postcss(plugins);

const transform = async () => {
  const files = glob.sync("../launchpad-ui/packages/**/stories/**/*.css");

  // Loop through each of the files. Since processing the CSS
  // is async, handling each file is async so we end up with
  // an array of promises.
  const filePromises = files.map(async (file) => {
    // Read the file and convert it to a string.
    // This is effectively equivalent to the `css`
    // variable that was previously defined above.
    const contents = fs.readFileSync(file).toString();

    // Identical, but the `css` variable was swapped for the file `contents`.
    const result = await processor.process(contents, { from: undefined });

    // Instead of logging the result, write the
    // result back to the original file, completing
    // the transformation for this file.
    fs.writeFileSync(file, result.css);
  });

  // Wait for the array of promises to all resolve.
  await Promise.all(filePromises);
};

transform();
