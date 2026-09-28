import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

/// Labelled text field: the label sits above the input (never placeholder-
/// only), with optional hint, helper, inline validation and "(optional)".
class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.controller,
    this.hint,
    this.helper,
    this.optional = false,
    this.validator,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.onFieldSubmitted,
    this.maxLength,
    this.minLines,
    this.maxLines = 1,
    this.prefixIcon,
    this.autofocus = false,
    this.enabled = true,
    this.inputFormatters,
    this.autofillHints,
  });

  final String label;
  final TextEditingController? controller;
  final String? hint;
  final String? helper;
  final bool optional;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onFieldSubmitted;
  final int? maxLength;
  final int? minLines;
  final int? maxLines;
  final IconData? prefixIcon;
  final bool autofocus;
  final bool enabled;
  final List<TextInputFormatter>? inputFormatters;
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            text: label,
            style: t.titleSmall?.copyWith(fontWeight: FontWeight.w500),
            children: [
              if (optional) TextSpan(text: '  Optional', style: t.bodySmall),
            ],
          ),
        ),
        const SizedBox(height: Space.xs),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          textCapitalization: textCapitalization,
          onFieldSubmitted: onFieldSubmitted,
          maxLength: maxLength,
          minLines: minLines,
          maxLines: maxLines,
          autofocus: autofocus,
          enabled: enabled,
          inputFormatters: inputFormatters,
          autofillHints: autofillHints,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          style: t.bodyLarge,
          decoration: InputDecoration(
            hintText: hint,
            helperText: helper,
            helperMaxLines: 2,
            prefixIcon: prefixIcon == null ? null : Icon(prefixIcon, color: c.muted, size: 20),
            // Label is rendered above; keep an accessible name on the field.
            semanticCounterText: '',
          ),
        ),
      ],
    );
  }
}
