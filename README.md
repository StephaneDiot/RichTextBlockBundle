# RichTextBlockBundle
Early and unsupported rich text block for eZ Platform Enterprise Edition. This block is only a custom prototype and has no relations with the 'real Rich Text Block' coming with V2.1.

## install

1. Add the bundle in your 'src/' folder
2. Register your Bundle in 'AppKernel.php' by adding ```new EzSystems\RichtextBlockBundle\EzSystemsRichtextBlockBundle(),```
3. Update your 'routing.yml' with 
```
ez_systems_richtext_block:
    resource: "@EzSystemsRichtextBlockBundle/Resources/config/routing.yml"
    prefix:   /
```

## How to use

Just go to 'Page' in your back-office, then create or edit a landing page, you should have a block called 'RichTextBlock', you can now edit a text using the same online editor than we have in Platform.
This block has very basics layout but you can easily update template or add block definition to get it more useful. See: https://doc.ezplatform.com/en/2.0/cookbook/creating_landing_page_blocks_(enterprise)/ 

