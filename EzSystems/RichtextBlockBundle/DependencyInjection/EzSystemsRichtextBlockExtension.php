<?php

namespace EzSystems\RichtextBlockBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\Loader;
use Symfony\Component\Yaml\Yaml;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use eZ\Bundle\EzPublishCoreBundle\DependencyInjection\Configuration\SiteAccessAware\ConfigurationProcessor;
use eZ\Bundle\EzPublishCoreBundle\DependencyInjection\Configuration\SiteAccessAware\ContextualizerInterface;
use Symfony\Component\Config\Resource\FileResource;

/**
 * This is the class that loads and manages your bundle configuration.
 *
 * @link http://symfony.com/doc/current/cookbook/bundles/extension.html
 */
class EzSystemsRichtextBlockExtension extends Extension implements PrependExtensionInterface
{
    /**
     * {@inheritdoc}
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);
        $loader = new Loader\YamlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config'));
        $loader->load('services.yml');
        $processor = new ConfigurationProcessor( $container, 'ez_systems_richtext_block' );

        // $loader->load('block_layout.yml');
        // $processor = new ConfigurationProcessor( $container, 'ez_systems_landing_page_field_type' );
    }
    public function prepend( ContainerBuilder $container )
    {


        $configFile = __DIR__ . '/../Resources/config/block_layout.yml';
        $config = Yaml::parse(file_get_contents($configFile));
        $container->prependExtensionConfig('ez_systems_landing_page_field_type', $config);
        $container->addResource(new FileResource($configFile));
        $container->prependExtensionConfig( 'assetic', array( 'bundles' => array( 'EzSystemsRichtextBlockBundle' ) ) );
        $this->prependYui( $container );
        $this->prependCss( $container );
    }
    private function prependYui( ContainerBuilder $container )
    {
        $container->setParameter(
            'richtext_block.public_dir',
            'bundles/ezsystemsrichtextblock'
        );
        $yuiConfigFile = __DIR__ . '/../Resources/config/yui.yml';
        $config = Yaml::parse( file_get_contents( $yuiConfigFile ) );
        $container->prependExtensionConfig( 'ez_platformui', $config );
        $container->addResource( new FileResource( $yuiConfigFile ) );
    }
    private function prependCss( ContainerBuilder $container )
    {
        $container->setParameter(
            'extending_platformui.css_dir',
            'bundles/ezsystemsrichtextblock/css'
        );
        $cssConfigFile = __DIR__ . '/../Resources/config/css.yml';
        $config = Yaml::parse( file_get_contents( $cssConfigFile ) );
        $container->prependExtensionConfig( 'ez_platformui', $config );
        $container->addResource( new FileResource( $cssConfigFile ) );
    }
}
