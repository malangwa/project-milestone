import 'package:dio/dio.dart';

import '../../core/network/dio_client.dart';
import '../models/search_result_model.dart';

class SearchService {
  SearchService._();
  static final SearchService instance = SearchService._();
  final Dio _dio = DioClient.instance.dio;

  Future<SearchResultModel> search(String query) async {
    final res = await _dio.get<dynamic>('/search', queryParameters: {'q': query});
    final data = res.data is Map && (res.data as Map).containsKey('data')
        ? res.data['data']
        : res.data;
    return SearchResultModel.fromJson(data is Map<String, dynamic> ? data : {});
  }
}
