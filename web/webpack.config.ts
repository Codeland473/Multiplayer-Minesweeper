import { Configuration } from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const configuration: Configuration = {
	entry: {
		index: './src/index.tsx',
	},
	mode: 'development',
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.vanilla\.css$/i,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: { url: false },
					},
				],
			},
			{
				test: /\.tsx?$/i,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /.svg$/i,
				loader: 'svg-inline-loader',
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		extensionAlias: { '.js': ['.js', '.ts', '.tsx'] },
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve('src/assets/index.html'),
			filename: path.resolve('../run/page/index.html'),
			inject: 'head',
		}),
		new VanillaExtractPlugin(),
		new MiniCssExtractPlugin(),
	],
	output: {
		filename: '[name].js',
		path: path.resolve('../run/page'),
	},
};
export default configuration;
