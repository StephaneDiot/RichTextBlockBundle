<?php
namespace EzSystems\RichtextBlockBundle\Twig;

use eZ\Publish\Core\FieldType\RichText;
use eZ\Publish\Core\FieldType\RichText\Converter as RichTextConverterInterface;
use Twig_Extension;
use Twig_SimpleFilter;
use DOMDocument;

class RichTextExtension extends Twig_Extension
{
    /**
     * @var RichTextConverterInterface
     */
    private $richTextConverter;

    /**
     * @var RichTextConverterInterface
     */
    private $richTextEditConverter;

    /**
     * @var RichText\Type
     */
    private $richTextFieldType;

    public function __construct( RichTextConverterInterface $richTextConverter, RichTextConverterInterface $richTextEditConverter, RichText\Type $richTextFieldType )
    {
        $this->richTextConverter = $richTextConverter;
        $this->richTextEditConverter = $richTextEditConverter;
        $this->richTextFieldType = $richTextFieldType;
    }

    public function getName()
    {
        return 'ez_systems_richtext_block.rich_text';
    }

    public function getFilters()
    {
        return array(
            new Twig_SimpleFilter(
                'bloc_richtext_to_html5',
                array( $this, 'richTextToHtml5' ),
                array( 'is_safe' => array( 'html' ) )
            )
        );
    }

    /**
     * Implements the "richtext_to_html5" filter.
     *
     * @param \DOMDocument $xmlData
     *
     * @return string
     */
    public function richTextToHtml5( $xmlData )
    {

        try{
            /** @var RichText\Value $value */
            $value = $this->richTextFieldType->acceptValue($xmlData);
            if ($value->xml instanceof DOMDocument) {
                $xml = $value->xml;
            } else {
                $xml = new DOMDocument();
                $xml->loadXML($value->xml === null ? RichText\Value::EMPTY_VALUE : $value->xml);
            }
            return $this->richTextConverter->convert( $xml )->saveHTML();
        }catch (\eZ\Publish\Core\Base\Exceptions\InvalidArgumentException $e){
            return "<pre>".$xmlData."</pre>";
        }

    }
}
